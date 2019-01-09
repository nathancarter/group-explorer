
/*
 * A Sheet Model is a data structure somewhat in the sense of the model-view paradigm,
 * in that it stores all the data for a sheet, but does not own the on-screen HTML
 * element that displays the sheet to the user.
 *
 * I say "somewhat," however, because we do provide the model an HTML element at
 * construction time into which it is in charge of syncing its data.  It will ask its
 * contained Sheet Elements to create and destroy HTML element in that view as needed.
 */
class SheetModel {

    // The constructor takes an on-screen HTML element in which to place the
    // representation of sheet elements.
    constructor ( element ) {
        if ( !( element instanceof HTMLElement ) )
            throw new Error( 'SheetModel requires an HTMLElement at construction' );
        this.view = element;
        this.elements = [ ];
        this.history = [ JSON.stringify( this.toJSON() ) ];
        this.historyIndex = 0;
        this.undoRedoActive = true;
        this.maxHistorySize = 250;
    }

    // Add a Sheet Element to the model.
    // Don't call this directly; just construct the element with the model as parameter.
    addElement ( element ) {
        if ( !( element instanceof SheetElement ) )
            throw new Error( 'SheetModel.addElement accepts only SheetElements' );
        // get current max z-index so we can use it below
        const maxIndex = this.elements.length > 0 ?
            Math.max( ...this.elements.map( ( e ) => e.zIndex ) ) : 0;
        // add element to internal array of elements
        this.elements.push( element );
        // ensure the new element has the highest z-index of all elements in the model
        element.zIndex = maxIndex + 1;
        // update view very soon
        var that = this;
        setTimeout( function () { that.sync(); }, 0 );
    }

    // Find the currently selected element and return it as a SheetElement instance,
    // or undefined if there is none.
    selected () {
        return this.elements.find( ( sheetElt ) =>
            $( sheetElt.htmlViewElement().parentElement ).hasClass( selectedForDraggingClass ) );
    }

    // Ensure that the children of the view are precisely the set of DIVs placed there
    // by wrapping each SheetElement's htmlViewElement() in a DIV.
    sync () {
        var that = this;
        // Delete any elements that don't belong
        Array.from( this.view.childNodes ).map( function ( htmlElt ) {
            if ( htmlElt.id == 'overlay' ) return;
            if ( !that.elements.find( ( sheetElt ) => htmlElt.childNodes[0] == sheetElt.htmlViewElement() ) ) {
                htmlElt.parentElement.removeChild( htmlElt );
            }
        } );
        // Ensure all Sheet Elements have their HTML element in the view
        this.elements.map( function ( sheetElt ) { that.buildWrapperFor( sheetElt ); } );
        // Update any overlay drawing that may need to be done.
        this.drawOverlay();
        // While we're here, if anything changed since the last time we were here,
        // record it on the undo/redo stack.
        if ( this.undoRedoActive ) {
            function updateUndoRedoStack () {
                // ensure elements are fully initialized before recording their state
                if ( !that.elements.every( ( elt ) => elt.isReady() ) )
                    return setTimeout( updateUndoRedoStack, 25 );
                // ok all elements are ready; we can proceed
                var last = that.history[that.historyIndex];
                var next = JSON.stringify( that.toJSON() );
                if ( next != last ) {
                    // do the work of updating the history array
                    that.history = that.history.slice( 0, that.historyIndex + 1 );
                    that.history.push( next );
                    that.historyIndex++;
                    if ( that.history.length > that.maxHistorySize ) {
                        that.history.shift();
                        that.historyIndex--;
                    }
                    // also, tell all my new elements that they may have been resized,
                    // and they should check and maybe re-render themselves.
                    that.elements.map( ( elt ) => { if ( elt.emit ) elt.emit( 'resize' ); } );
                }
            }
            updateUndoRedoStack();
        }
        this.view.dispatchEvent( new CustomEvent( 'synced', { bubbles : true } ) );
    }
    // Helper function used by sync() to create wrapper DIVs
    buildWrapperFor ( sheetElt ) {
        var htmlElt = sheetElt.htmlViewElement();
        if ( !htmlElt.parentElement || htmlElt.parentElement.parentElement != this.view ) {
            var wrapper = $( '<div></div>' )[0];
            wrapper.appendChild( htmlElt );
            $( wrapper ).draggableAndSizable();
            $( wrapper ).css( {
                position : 'absolute',
                padding : `${defaultResizingMargin}px`,
                "z-index" : sheetElt.zIndex
            } );
            this.view.appendChild( wrapper );
        }
    }
    // Since sync() tracks the undo/redo stack, we can implement undo/redo methods.
    canUndo () { return this.historyIndex > 0; }
    canRedo () { return this.historyIndex < this.history.length - 1; }
    undo () {
        if ( this.canUndo() )
            this.fromJSON( JSON.parse( this.history[--this.historyIndex] ), true );
    }
    redo () {
        if ( this.canRedo() )
            this.fromJSON( JSON.parse( this.history[++this.historyIndex] ), true );
    }

    // Save the state of this entire sheet by creating an array of the JSON states of the
    // elements in the model.
    // First, sort elements so that all ConnectingElements are at the end, so that they
    // can mention the indices of their endpoints, and deserializing will know what those
    // indices mean.
    toJSON () {
        this.elements.sort( function ( a, b ) {
            return ( a instanceof ConnectingElement ) ?
                   ( ( b instanceof ConnectingElement ) ? 0 : 1 ) :
                   ( ( b instanceof ConnectingElement ) ? -1 : 0 );
        } );
        return this.elements.map( ( elt ) => elt.toJSON() );
    }
    // Restore the state from a previous save by destroying all existing content first,
    // then filling it anew with newly created instances based on the given data.  End
    // with a sync call.  Requires JSON in the format produced by toJSON(), above.
    // The optional second argument is for internal use, and lets us navigate the
    // undo/redo stack without corrupting it.
    fromJSON ( json, isPartOfUndoOrRedo ) {
        var that = this;
        this.undoRedoActive = false;
        // each call to sheetElementFromJSON() adds to the elements array,
        // so that later elements can look up earlier ones.
        this.elements = [ ];
        json.map( function ( eltJson ) { that.sheetElementFromJSON( eltJson ); } );
        if ( !isPartOfUndoOrRedo ) {
            this.history = [ JSON.stringify( json ) ];
            this.historyIndex = 0;
        }
        this.sync();
        this.undoRedoActive = true;
    }
    // Helper function to the one above:
    sheetElementFromJSON ( json ) {
        if ( !/^[a-zA-Z_][a-zA-Z_0-9]*$/.test( json.className ) )
            throw new Error( `Invalid class name: ${json.className}` );
        var ctor = eval( json.className );
        var result = new ctor( this );
        this.buildWrapperFor( result );
        result.fromJSON( json );
        return result;
    }

    // Do the rectangles of these two sheet elements intersect?
    intersect ( elt1, elt2 ) {
        var $elt1 = $( elt1.htmlViewElement().parentElement ),
            $elt2 = $( elt2.htmlViewElement().parentElement ),
            rect1 = { left : $elt1.offset().left, top : $elt1.offset().top,
                      right : $elt1.offset().left + $elt1.width(),
                      bottom : $elt1.offset().top + $elt1.height () },
            rect2 = { left : $elt2.offset().left, top : $elt2.offset().top,
                      right : $elt2.offset().left + $elt2.width(),
                      bottom : $elt2.offset().top + $elt2.height () };
        return !(
            ( rect1.right < rect2.left ) ||
            ( rect1.left > rect2.right ) ||
            ( rect1.bottom < rect2.top ) ||
            ( rect1.top > rect2.bottom )
        );
    }

    // This function takes two sheet elements and moves the first ("from") to have the
    // z-index of the second ("to"), and shifts all the z-indices between those two
    // values by one step in the direction of "from"'s original z-index, to preserve
    // uniqueness.
    adjustZ ( from, to ) {
        var min = Math.min( from.zIndex, to.zIndex ),
            max = Math.max( from.zIndex, to.zIndex ),
            adj = ( from.zIndex > to.zIndex ) ? 1 : -1;
        function moveOne ( element, newz ) {
            $( element.htmlViewElement().parentElement )
                .css( { "z-index" : element.zIndex = newz } );
        }
        moveOne( from, to.zIndex );
        this.elements.map( function ( element ) {
            if ( ( element != from )
              && ( element.zIndex >= min ) && ( element.zIndex <= max ) )
                moveOne( element, element.zIndex + adj );
        } );
    }
    // This function finds the nearest element below the given one and calls adjustZ()
    // to move the top one below the bottom one.  Only cares about elements with which
    // the given one actually interesct()s on screen.
    adjustZDown ( element ) {
        var highestBelow = null;
        var that = this;
        this.elements.map( function ( other ) {
            if ( that.intersect( element, other )
              && ( other.zIndex < element.zIndex )
              && ( ( highestBelow == null ) || ( other.zIndex > highestBelow.zIndex ) ) )
                highestBelow = other;
        } );
        if ( highestBelow ) this.adjustZ( element, highestBelow );
    }
    // Same as previous, but upwards instead.
    adjustZUp ( element ) {
        var lowestAbove = null;
        var that = this;
        this.elements.map( function ( other ) {
            if ( that.intersect( element, other )
              && ( other.zIndex > element.zIndex )
              && ( ( lowestAbove == null ) || ( other.zIndex < lowestAbove.zIndex ) ) )
                lowestAbove = other;
        } );
        if ( lowestAbove ) this.adjustZ( element, lowestAbove );
    }

    // If any SheetElements want to draw on the overlay, they do so here.
    drawOverlay () {
        const $view = $( this.view );
        const canvas = $view.find( 'canvas' )[0];
        canvas.width = $view.width();
        canvas.height = $view.height();
        const context = canvas.getContext( '2d' );
        this.elements.map( function ( element ) {
            if ( element.drawOverlay ) element.drawOverlay( canvas, context );
        } );
    }
}

/*
 * A Sheet Element represents the data contained in a single element that will be
 * shown on a Group Explorer sheet (such as a rectangle, some text, a connection,
 * a morphism, a visualization, etc.).
 *
 * At construction time, it requires a SheetModel that will contain it.
 * It can compute, if requested, an HTML element representing itself, for inclusion
 * in the view of its parent SheetModel.
 */
class SheetElement {

    // The parameter must be a SheetModel that will contain this.
    // This function notifies the model that this object has been added to it.
    constructor ( model ) {
        if ( !( model instanceof SheetModel ) )
            throw new Error( 'SheetElements must be constructed with a SheetModel' );
        this.model = model;
        model.addElement( this );
        this.events = { }; // see "on" function, below
    }

    // By default, a sheet element is always ready to have its JSON recorded.
    // But subclasses that have asynchronous initialization to do can override this.
    isReady () { return true; }

    // This object can create (and later return) an HTML element representing itself.
    // This function does that, delegating the creation work to a createHtmlViewElement()
    // function that subclasses can override without having to reimplement the
    // caching behavior implemented here.
    htmlViewElement () {
        if ( !this.hasOwnProperty( 'viewElement' ) ) {
            this.viewElement = this.createHtmlViewElement();
            this.viewElement.setAttribute( 'title', 'Double-click to edit' );
            var that = this;
            $( this.viewElement ).on( 'dblclick', function () {
                window.getSelection().empty();
                that.edit();
                return false;
            } );
            this.viewElement.addEventListener( 'moved', function () { that.emit( 'move' ); } );
            this.viewElement.addEventListener( 'resized', function () { that.emit( 'resize' ); } );
        }
        return this.viewElement;
    }

    // See above for explanation of this function.
    // It should be called only by htmlViewElement(), never by the client.
    // Thus it is called but once per SheetElement instance.
    createHtmlViewElement () {
        // This is a stub implementation that subclasses should override.
        return $( '<div></div>' )[0];
    }

    // Parallel structure to htmlViewElement(), but now for the editing controls of the
    // element rather than its standard view.
    htmlEditElement () {
        if ( !this.hasOwnProperty( 'editElement' ) )
            this.editElement = this.createHtmlEditElement();
        return this.editElement;
    }

    // Parallel structure to createHtmlViewElement(), but now for the editing controls of the
    // element rather than its standard view.
    createHtmlEditElement () {
        // This is a stub implementation that subclasses should override.
        return $( '<div></div>' )[0];
    }

    // Removes this element from the model and its HTML element from the model's view
    remove () {
        this.emit( 'delete' ); // right before being deleted
        var index = this.model.elements.indexOf( this );
        this.model.elements.splice( index, 1 );
        var wrapper = this.htmlViewElement().parentElement;
        wrapper.parentElement.removeChild( wrapper );
        this.model.sync();
    }

    // Enter edit mode by swapping the view and the edit controls in the wrapper.
    edit () {
        var viewer = this.htmlViewElement();
        var editor = this.htmlEditElement();
        if ( editor.parentElement != viewer.parentElement )
            viewer.parentElement.appendChild( editor );
        if ( !this.buttons ) {
            $( editor ).append(
                this.buttons = $(
                    '<p><button class="ok-button">OK</button>'
                  + '<button class="cancel-button">Cancel</button></p>'
                )
            );
            var that = this;
            $( editor ).find( '.ok-button' ).click( function () {
                that.saveEdits();
                that.showViewControls();
            } );
            $( editor ).find( '.cancel-button' ).click( () => that.showViewControls() );
        }
        this.loadEdits();
        this.showEditControls();
    }

    // Hide view controls and show edit controls
    showEditControls () {
        $( this.htmlViewElement() ).hide();
        $( this.htmlEditElement() ).show();
        var $wrapper = $( this.htmlViewElement().parentElement );
        $wrapper.removeDragAndSizeSelection();
        $wrapper.pauseDragAndResize();
        this.zBeforeEdit = $wrapper.css( 'z-index' );
        this.bgBeforeEdit = $( this.htmlEditElement() ).css( 'background-color' );
        $wrapper.css( 'z-index', 1000 );
        $( this.htmlEditElement() ).css( 'background-color', 'white' );
    }
    // Reverse of the previous
    showViewControls () {
        $( this.htmlViewElement() ).show();
        $( this.htmlEditElement() ).hide();
        var $wrapper = $( this.htmlViewElement().parentElement );
        $wrapper.unpauseDragAndResize();
        if ( this.hasOwnProperty( 'zBeforeEdit' ) ) {
            $wrapper.css( 'z-index', this.zBeforeEdit );
            delete this.zBeforeEdit;
        }
        if ( this.hasOwnProperty( 'bgBeforeEdit' ) ) {
            $( this.htmlEditElement() ).css( 'background-color', this.bgBeforeEdit );
            delete this.bgBeforeEdit;
        }
    }

    // This function should read from its edit controls and save their meaning into
    // our internal state.  Because this is the abstract base class, it is a stub.
    saveEdits () { }
    // This function is the reverse of the previous; it puts the internal state into
    // the edit controls.  Because this is the abstract base class, it is a stub.
    loadEdits () { }

    // Handy utility for subclasses: Ensures the wrapper node is just the right
    // size for the stuff you've put in the view.
    fitWrapperToView () {
        var view = $( this.htmlViewElement() );
        if ( !view[0].parentElement ) return;
        $( view[0].parentElement ).width( view.width() ).height( view.height() );
    }

    // Subclasses should override this to create an actual object representing the
    // instance.  Always include the class name.  Always start with this object
    // and then alter/extend.
    toJSON () {
        var $wrapper = $( this.htmlViewElement().parentElement );
        var result = {
            className : 'SheetElement',
            x : $wrapper.offset().left,
            y : $wrapper.offset().top,
            w : $wrapper.width(),
            h : $wrapper.height(),
            z : $wrapper.css( 'z-index' )
        };
        // View-based data may be stored in the _extra_json object.
        // For example, the state of UI components can go there.  It's foreign data,
        // from the point of view of the model, so we separate it, but respect it.
        if ( this._extra_json )
            for ( var key in this._extra_json )
                if ( this._extra_json.hasOwnProperty( key ) )
                    result[key] = this._extra_json[key];
        return result;
    }
    // The reverse of the above method is this one.  It presumes that the class of
    // this instance is equal to json.className, and then extracts all relevant data
    // from the parameter to re-establish the saved state.  Again, subclasses should
    // override and can feel free to call this method as part of their work.
    fromJSON ( json ) {
        var $wrapper = $( this.htmlViewElement().parentElement );
        $wrapper.offset( { left : json.x, top : json.y } )
                .width( json.w ).height( json.h )
                .css( { "z-index" : json.z } );
        this.emit( 'resize' );
        // Any key that begins with an underscore is UI state data.
        // That's not relevant to the model, but we have to store it so that we can
        // save it with the sheet, and send it back later in toJSON().
        for ( var key in json ) {
            if ( json.hasOwnProperty( key ) && key[0] == '_' ) {
                if ( !this._extra_json ) this._extra_json = { };
                this._extra_json[key] = json[key];
            }
        }
    }

    // SheetElements are also event emitters
    _eventsForName ( eventName ) {
        if ( !this.events.hasOwnProperty( eventName ) )
            this.events[eventName] = new Set();
        return this.events[eventName];
    }
    on ( eventName, handler ) {
        this._eventsForName( eventName ).add( handler );
    }
    off ( eventName, handler ) {
        this._eventsForName( eventName ).delete( handler );
    }
    emit ( eventName, ...args ) {
        var that = this;
        this._eventsForName( eventName ).forEach( function ( handler ) {
            handler.apply( that, args );
        } );
    }

    // Subclasses should override this to make a human-readable description:
    toString () { return "A sheet element"; }
}

/*
 * Simplest SheetElement subclass: a colored rectangle.
 */
class RectangleElement extends SheetElement {
    // only defining feature: background color
    constructor ( model ) {
        super( model );
        this.color = '#dddddd';
        this.update();
    }
    // just represented by a div that fills its container and starts at size 100x100
    createHtmlViewElement () {
        var result = $( '<div></div>' )[0];
        $( result ).css( {
            height: '100%',
            width : '100%',
            minWidth : '100px',
            minHeight : '100px'
        } );
        return result;
    }
    // when editing, use a color-type input
    createHtmlEditElement () {
        var result = $( '<div>'
                      + 'Background color: '
                      + `<input type="color" class="color-input" value="${this.color}"/>`
                      + '</div>' )[0];
        $( result ).css( {
            minWidth : '100px',
            minHeight : '100px'
        } );
        return result;
    }
    // update appearance with this function
    update () {
        $( this.htmlViewElement() ).css( { backgroundColor : this.color } );
        $( this.htmlEditElement() ).css( { backgroundColor : this.color } );
        this.fitWrapperToView();
    }
    // implement abstract methods save/loadEdits()
    saveEdits () {
        this.color = $( this.htmlEditElement() ).find( '.color-input' )[0].value;
        this.update();
        this.model.sync();
    }
    loadEdits () {
        $( this.htmlEditElement() ).find( '.color-input' )[0].value = this.color;
    }
    // serialization just needs to take color into account
    toJSON () {
        var result = super.toJSON();
        result.className = 'RectangleElement';
        result.color = this.color;
        return result;
    }
    fromJSON ( json ) {
        super.fromJSON( json );
        this.color = json.color;
        this.update();
    }
    // Give vague rectangle description
    toString () {
        const $view = $( this.htmlViewElement() );
        return `Rectangle at (${$view.offset().left},${$view.offset().top})`;
    }
}

/*
 * SheetElement subclass for showing text
 */
class TextElement extends SheetElement {
    // three defining features: text, font size, font color
    constructor ( model ) {
        super( model );
        this.text = 'Text';
        this.fontSize = '12pt';
        this.fontColor = '#000000';
        this.update();
    }
    // helper function to produce inner HTML from the above defining attributes
    innerHTML () {
        var simplified = this.text || '';
        const style = 'style="margin: 0;"';
        simplified = `<p ${style}>` + simplified.replace( RegExp( '\n', 'g' ), `</p><p ${style}>` ) + '</p>';
        return `<div style="font-size: ${this.fontSize}; color: ${this.fontColor};">`
             + simplified + '</div>';
    }
    // represented by a span with the given font styles and text content
    createHtmlViewElement () {
        var result = $( this.innerHTML() )[0];
        $( result ).css( {
            "-webkit-touch-callout" : "none",
            "-khtml-user-select": "none",
            "-moz-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none"
        } );
        return result;
    }
    // when editing, use one input for each defining feature
    createHtmlEditElement () {
        return $(
            '<div style="min-width: 200px; border: 1px solid black;">'
          + '<p>Text content:</p>'
          + `<textarea class="text-input" width="100%">${this.text}</textarea>`
          + '<p>Text size: '
          + `<input type="range" min="8" max="100" class="size-input" value="${this.fontSize}"/></p>`
          + '<p>Text color: '
          + `<input type="color" class="color-input" value="${this.fontColor}"/></p>`
          + '</div>' )[0];
    }
    // update appearance with this function
    update () {
        $( this.htmlViewElement() ).html( this.innerHTML() );
        this.fitWrapperToView();
    }
    // implement abstract methods save/loadEdits()
    saveEdits () {
        this.text = $( this.htmlEditElement() ).find( '.text-input' )[0].value;
        this.fontSize = $( this.htmlEditElement() ).find( '.size-input' )[0].value + 'pt';
        this.fontColor = $( this.htmlEditElement() ).find( '.color-input' )[0].value;
        this.update();
        this.model.sync();
    }
    loadEdits () {
        $( this.htmlEditElement() ).find( '.text-input' )[0].value = this.text;
        $( this.htmlEditElement() ).find( '.size-input' )[0].value = parseInt( this.fontSize );
        $( this.htmlEditElement() ).find( '.color-input' )[0].value = this.fontColor;
    }
    // serialization just needs to take into account text, size, and color
    toJSON () {
        var result = super.toJSON();
        result.className = 'TextElement';
        result.text = this.text;
        result.fontSize = this.fontSize;
        result.fontColor = this.fontColor;
        return result;
    }
    fromJSON ( json ) {
        super.fromJSON( json );
        this.text = json.text;
        this.fontSize = json.fontSize;
        this.fontColor = json.fontColor;
        this.update();
    }
    // Give description with sample text
    toString () {
        var text = this.text;
        if ( text.length > 20 ) text = text.substring( 0, 20 ) + '...';
        return `Text box "${text}"`;
    }
}

/*
 * SheetElement subclass for showing a visualizer for a group
 */
class VisualizerElement extends SheetElement {
    // abstract functions that must be overridden in subclasses:
    makeVisualizerObject ( group ) { }
    makeVisualizerDisplay ( options ) { }
    getEditPage () { }
    getClassName () { }
    // constructor
    constructor ( model, groupURL ) {
        super( model );
        this.groupURL = groupURL;
        this.vizdisplay = this.makeVisualizerDisplay( { width : 100, height : 100 } );
        var that = this;
        if ( groupURL ) { // may be absent if they will fill it using fromJSON()
            Library.getGroupFromURL( groupURL )
                   .then( ( group ) => {
                       that.vizobj = that.makeVisualizerObject( that.group = group );
                       that.rerender();
                   } )
                   .catch( function ( error ) { console.log( error ); } );
        }
        // when a resize happens, build a new image, but only if a resize actually happened
        this.on( 'resize', function () {
            var $wrapper = $( that.htmlViewElement().parentElement );
            var lastSize = that.vizdisplay.getSize();
            if ( ( lastSize.w != $wrapper.width() )
              || ( lastSize.h != $wrapper.height() ) ) {
                that.vizdisplay.setSize( $wrapper.width(), $wrapper.height() );
                that.rerender();
            }
        } );
    }
    // not ready unless teh group has been loaded
    isReady () { return !!this.vizobj; }
    // how to create an image of the visualizer
    render () {
        var result = this.vizobj ?
            this.vizdisplay.getImage( this.vizobj, {
                size : "large",
                resetCamera : !this._extra_json || !this._extra_json._camera
            } ) :
            $( '<img/>' )[0];
        $( result ).css( { "pointer-events" : "none" } );
        var $wrapper = $( '<div></div>' );
        $wrapper.append( result );
        return $wrapper[0];
    }
    // how to force updating with the latest image
    rerender () {
        var that = this;
        setTimeout( function () {
            var $wrapper = $( that.htmlViewElement().parentElement );
            if ( !$wrapper[0] ) return;
            $wrapper[0].removeChild( that.htmlViewElement() );
            delete that.viewElement; // forces recreation in next line
            $wrapper.append( that.htmlViewElement() );
        }, 0 );
    }
    // represented by a span with the given font styles and text content
    createHtmlViewElement () { return this.render(); }
    // override the default behavior for editing, because visualizers are special
    edit () {
        var that = this;
        setTimeout( function () {
            var otherWin = that.editWindow =
                window.open( that.getEditPage() + '?groupURL=' + encodeURIComponent( that.groupURL ) );
            var otherWinState = 'starting';
            otherWin.addEventListener( 'message', function ( event ) {
                if ( otherWinState == 'starting' && event.data == 'listener ready' ) {
                    // initially set up the editor to be just like us
                    const myURL = window.location.href;
                    const thirdSlash = myURL.indexOf( '/', 8 );
                    const myDomain = myURL.substring( 0, thirdSlash > -1 ? thirdSlash : myURL.length );
                    otherWin.postMessage( {
                        source : 'sheet',
                        json : that.toJSON()
                    }, myDomain );
                    otherWinState = 'loading my state';
                    return;
                }
                if ( otherWinState == 'loading my state' && event.data == 'state loaded' ) {
                    otherWinState = 'ready';
                    return;
                }
                if ( otherWinState == 'ready' ) {
                    // but when the editor changes, update us to be just like it
                    if ( event.data.source == 'editor' ) that.fromJSON( event.data.json );
                }
            }, false );
        }, 10 );
    }
    // serialization just needs to take into account text, size, and color
    toJSON () {
        var result = super.toJSON();
        result.className = this.getClassName();
        if ( this.vizobj ) {
            var key, inner = this.vizdisplay.toJSON( this.vizobj );
            for ( key in inner )
                if ( inner.hasOwnProperty( key ) ) result[key] = inner[key];
        }
        return result;
    }
    fromJSON ( json ) {
        super.fromJSON( json );
        var that = this;
        if ( json.groupURL ) {
            if ( json.groupURL != this.groupURL ) {
                Library.getGroupFromURL( json.groupURL )
                       .then( ( group ) => {
                           that.vizobj = that.makeVisualizerObject( that.group = group );
                           that.vizdisplay.fromJSON( json, that.vizobj );
                           that.rerender();
                       } )
                       .catch( function ( error ) { console.log( error ); } );
            } else {
                this.vizdisplay.fromJSON( json, this.vizobj );
                this.rerender();
            }
        }
    }
    // Generic reply that can be adjusted in subclasses
    toString () {
        const groupname = this.vizobj ? this.vizobj.group.name : 'a group';
        return `Visualization for ${groupname}`;
    }
}

/*
 * SheetElement subclass for showing the multiplication table of a group
 */
class MTElement extends VisualizerElement {
    makeVisualizerObject ( group ) { return new Multtable( group ); }
    makeVisualizerDisplay ( options ) { return new DisplayMulttable( options ); }
    getEditPage () { return './Multtable.html'; }
    getClassName () { return 'MTElement'; }
    toString () {
        return super.toString().replace( 'Visualization', 'Multiplication table' );
    }
}

/*
 * SheetElement subclass for showing the cycle graph of a group
 */
class CGElement extends VisualizerElement {
    makeVisualizerObject ( group ) { return new CycleGraph( group ); }
    makeVisualizerDisplay ( options ) { return new DisplayCycleGraph( options ); }
    getEditPage () { return './CycleDiagram.html'; }
    getClassName () { return 'CGElement'; }
    toString () {
        return super.toString().replace( 'Visualization', 'Cycle graph' );
    }
}

/*
 * SheetElement subclass for showing the Cayley diagram of a group
 */
class CDElement extends VisualizerElement {
    makeVisualizerObject ( group ) {
        return group.cayleyDiagrams.length > 0 ?
               new CayleyDiagram( group, group.cayleyDiagrams[0].name ) :
               new CayleyDiagram( group );
    }
    makeVisualizerDisplay ( options ) { return new DisplayDiagram( options ); }
    getEditPage () { return './CayleyDiagram.html'; }
    getClassName () { return 'CDElement'; }
    toString () {
        return super.toString().replace( 'Visualization', 'Cayley diagram' );
    }
}

/*
 * SheetElement subclass for connecting two other SheetElements
 */
class ConnectingElement extends SheetElement {
    // Must be constructed with two sheet elements to be connected
    constructor ( model, from, to ) {
        super( model );
        if ( from && to ) this.setEndpoints( from, to );
        this.color = '#000000';
        this.thickness = 1;
        this.useArrowhead = false;
    }
    // Function to store both endpoints.
    setEndpoints ( from, to ) {
        if ( !( from instanceof SheetElement ) || !( to instanceof SheetElement ) )
            throw "Both parameters to ConnectingElement constructor must be SheetElements";
        if ( this.from )
            this.from.off( '')
        this.from = from;
        this.to = to;
        this.installHandlers();
        this.reposition();
    }
    // Function to install handlers on both endpoints.
    installHandlers () {
        var that = this;
        if ( !this.boundReposition )
            this.boundReposition = function () { that.reposition(); };
        if ( !this.boundRemove )
            this.boundRemove = function () {
                that.remove();
                that.uninstallHandlers();
            };
        [ this.from, this.to ].map( function ( endpoint ) {
            if ( endpoint ) {
                endpoint.on( 'resize', that.boundReposition );
                endpoint.on( 'move', that.boundReposition );
                endpoint.on( 'delete', that.boundRemove );
            }
        } );
    }
    // Inverse of previous.
    uninstallHandlers () {
        var that = this;
        [ this.from, this.to ].map( function ( endpoint ) {
            if ( endpoint ) {
                endpoint.off( 'resize', that.boundReposition );
                endpoint.off( 'move', that.boundReposition );
                endpoint.off( 'delete', that.boundRemove );
            }
        } );
    }
    // In toJSON(), report the indices of the endpoints.
    // This will be supported by the model, which sorts ConnectingElement instances last.
    toJSON () {
        var result = super.toJSON();
        result.className = 'ConnectingElement';
        result.fromIndex = this.model.elements.indexOf( this.from );
        result.toIndex = this.model.elements.indexOf( this.to );
        result.color = this.color;
        result.thickness = this.thickness;
        result.useArrowhead = this.useArrowhead;
        return result;
    }
    // In fromJSON(), you're given the indices, and you can look them up in the
    // model's list of elements, which is built one element at a time, so that later ones
    // can reference earlier ones.
    fromJSON ( json ) {
        super.fromJSON( json );
        this.color = json.color;
        this.thickness = json.thickness;
        this.useArrowhead = json.useArrowhead;
        this.arrowheadSize = 10;
        this.setEndpoints(
            this.model.elements[json.fromIndex],
            this.model.elements[json.toIndex]
        );
    }
    // Convenience function for internal use
    margin () { return this.arrowheadSize * this.thickness / 2; }
    // Reposition myself to pleasantly bridge the space between "from" and "to" on screen.
    // Then draw the line and optionally arrowhead, respecting all settings.
    reposition () {
        // Figure out where we belong on screen.
        const $fromWrapper = $( this.from.htmlViewElement().parentElement ),
              fromCenter = {
                  x : $fromWrapper.offset().left + $fromWrapper.width()/2,
                  y : $fromWrapper.offset().top + $fromWrapper.height()/2
              },
              $toWrapper = $( this.to.htmlViewElement().parentElement ),
              toCenter = {
                  x : $toWrapper.offset().left + $toWrapper.width()/2,
                  y : $toWrapper.offset().top + $toWrapper.height()/2
              },
              min = {
                  x : Math.min( fromCenter.x, toCenter.x ) - this.margin(),
                  y : Math.min( fromCenter.y, toCenter.y ) - this.margin(),
                  z : Math.min( $fromWrapper.css( 'z-index' ), $toWrapper.css( 'z-index' ) )
              },
              max = {
                  x : Math.max( fromCenter.x, toCenter.x ) + this.margin(),
                  y : Math.max( fromCenter.y, toCenter.y ) + this.margin(),
                  z : Math.max( $fromWrapper.css( 'z-index' ), $toWrapper.css( 'z-index' ) )
              };
        $( this.htmlViewElement().parentElement )
            .offset( { left : min.x, top : min.y } )
            .width( max.x - min.x )
            .height( max.y - min.y )
            .css( { "z-index" : min.z - 1 } );
        // Draw the connecting line.
        this.drawConnectingLine();
        // Emit a resize event.
        this.emit( 'resize' );
    }
    // How to draw my connecting line.
    drawConnectingLine () {
        var canvas = this.htmlViewElement();
        var $wrapper = $( canvas.parentElement );
        $( canvas ).width( $wrapper.width() ).height( $wrapper.height() );
        canvas.width = $wrapper.width();
        canvas.height = $wrapper.height();
        // Now draw a diagonal line across us.
        const context = canvas.getContext( '2d' ),
              $fromWrapper = $( this.from.htmlViewElement().parentElement ),
              $toWrapper = $( this.to.htmlViewElement().parentElement ),
              start = {
                  x : ( $fromWrapper.offset().left < $toWrapper.offset().left ) ?
                        this.margin() : canvas.width - this.margin(),
                  y : ( $fromWrapper.offset().top < $toWrapper.offset().top ) ?
                        this.margin() : canvas.height - this.margin()
              },
              stop = {
                  x : canvas.width - start.x,
                  y : canvas.height - start.y
              };
        context.moveTo( start.x, start.y );
        context.lineTo( stop.x, stop.y );
        context.strokeStyle = this.color;
        context.lineWidth = this.thickness;
        context.stroke();
        // Draw arrowhead if requested.
        const len = Math.sqrt( Math.pow( stop.x - start.x, 2 ) + Math.pow( stop.y - start.y, 2 ) );
        if ( ( len > 0 ) && this.useArrowhead ) {
            const unit = { x : ( stop.x - start.x ) / len, y : ( stop.y - start.y ) / len };
            const mid = { x : ( stop.x + start.x ) / 2, y : ( stop.y + start.y ) / 2 };
            const perp = { x : -unit.y, y : unit.x };
            context.moveTo( mid.x + margin * unit.x, mid.y + margin * unit.y );
            context.lineTo( mid.x - margin * unit.x + margin * perp.x,
                            mid.y - margin * unit.y + margin * perp.y );
            context.lineTo( mid.x - margin * unit.x - margin * perp.x,
                            mid.y - margin * unit.y - margin * perp.y );
            context.lineTo( mid.x + margin * unit.x, mid.y + margin * unit.y );
            context.fillStyle = this.color;
            context.fill();
        }
    }
    // This is shown as a canvas, which we will draw a diagonal line on whenenver
    // this element is repositioned/resized.
    createHtmlViewElement () { return $( '<canvas></canvas>' )[0]; }
    // when editing, use one input for each defining feature
    createHtmlEditElement () {
        return $(
            '<div style="min-width: 200px; border: 1px solid black;">'
          + '<p>Line color:</p>'
          + `<input type="color" class="color-input" value="${this.color}"/>`
          + '<p>Line thickness: '
          + `<input type="range" min="1" max="10" class="size-input" value="${this.thickness}"/></p>`
          + '<p><input type="checkbox" class="arrow-input" '
          + ( this.useArrowhead ? 'checked' : '' ) + '/> Draw arrowhead</p>'
          + '</div>' )[0];
    }
    // implement abstract methods save/loadEdits()
    saveEdits () {
        this.thickness = $( this.htmlEditElement() ).find( '.size-input' )[0].value;
        this.color = $( this.htmlEditElement() ).find( '.color-input' )[0].value;
        this.useArrowhead = $( this.htmlEditElement() ).find( '.arrow-input' ).prop( 'checked' );
        this.reposition();
        this.model.sync();
    }
    loadEdits () {
        $( this.htmlEditElement() ).find( '.size-input' )[0].value = parseInt( this.thickness );
        $( this.htmlEditElement() ).find( '.color-input' )[0].value = this.color;
        $( this.htmlEditElement() ).find( '.arrow-input' ).prop( 'checked', this.useArrowhead );
    }
    toString () {
        return `Connection from ${this.from.toString()} to ${this.to.toString()}`;
    }
}

/*
 * SheetElement representing a homomorphism from one group to another
 */
class MorphismElement extends ConnectingElement {
    // You can only set endpoints on a morphism if they're both pictures of groups.
    // (You can't connect, say, text to something with a morphism.)
    setEndpoints ( from, to ) {
        if ( !( from instanceof VisualizerElement )
          || !( to instanceof VisualizerElement ) )
            throw "Both parameters to MorphismElement constructor must be VisualizerElements";
        super.setEndpoints( from, to );
    }
    // Update toJSON() just to handle our class correctly.  We will extend this later.
    toJSON () {
        var result = super.toJSON();
        result.className = 'MorphismElement';
        return result;
    }
    // Override drawConnectingLine to do nothing for morphisms.
    drawConnectingLine () { }
    // Auxiliary function for finding the point of exit of a line from start to stop
    // (each of which is a point with .x and .y fields) from the box with corners
    // corner1 and corner2 (same data format).  The corners can come in either order.
    // This assumes that start is inside the box.
    static pointWhereLineExitsBox ( start, stop, corner1, corner2 ) {
        // Let v be the vector from start point to stop point.
        const v = { x : stop.x - start.x, y : stop.y - start.y };
        // Extend each box side to be a line, not just a line segment, and find
        // where the line intersects each, using its parametric equations where
        // t=0 is at start and t=1 is at stop.  Find the smallest positive finite one.
        const t = Math.min.apply( null, [
            ( corner1.x - start.x ) / v.x, ( corner2.x - start.x ) / v.x,
            ( corner1.y - start.y ) / v.y, ( corner2.y - start.y ) / v.y
        ].filter( function ( t ) {
            return !isNaN( t ) && isFinite( t ) && ( t > 0 );
        } ) );
        // Convert that back into a point and return it.
        return { x : start.x + t * v.x, y : start.y + t * v.y };
    }
    // Auxiliary function for drawing an arrow from A to B with arrowhead of size S.
    static drawArrow ( A, B, S, context ) {
        context.moveTo( A.x, A.y );
        context.lineTo( B.x, B.y );
        const dir = { x : B.x - A.x, y : B.y - A.y },
              len = Math.sqrt( Math.pow( dir.x, 2 ) + Math.pow( dir.y, 2 ) );
        if ( len > 0 ) {
            const unit = { x : dir.x / len, y : dir.y / len },
                  perp = { x : -unit.y / 2, y : unit.x / 2 };
            context.moveTo( B.x - S * unit.x + S * perp.x, B.y - S * unit.y + S * perp.y );
            context.lineTo( B.x, B.y );
            context.lineTo( B.x - S * unit.x - S * perp.x, B.y - S * unit.y - S * perp.y );
        }
    }
    // But we will draw overlays!  This is a temporary test to prove that it works;
    // it is certainly not the actual visualization for morphisms.
    drawOverlay ( canvas, context ) {
        const $fromWrapper = $( this.from.htmlViewElement().parentElement ),
              fromPadding = parseInt( $fromWrapper.css( 'padding' ) ),
              $toWrapper = $( this.to.htmlViewElement().parentElement ),
              toPadding = parseInt( $toWrapper.css( 'padding' ) ),
              left = $( this.model.view ).offset().left,
              top = $( this.model.view ).offset().top,
              f1 = { x : $fromWrapper.offset().left + fromPadding,
                     y : $fromWrapper.offset().top + fromPadding },
              f2 = { x : f1.x + $fromWrapper.width(), y : f1.y + $fromWrapper.height() },
              t1 = { x : $toWrapper.offset().left + toPadding,
                     y : $toWrapper.offset().top + toPadding },
              t2 = { x : t1.x + $toWrapper.width(), y : t1.y + $toWrapper.height() },
              fc = { x : ( f1.x + f2.x ) / 2, y : ( f1.y + f2.y ) / 2 },
              tc = { x : ( t1.x + t2.x ) / 2, y : ( t1.y + t2.y ) / 2 },
              exit = MorphismElement.pointWhereLineExitsBox( fc, tc, f1, f2 ),
              enter = MorphismElement.pointWhereLineExitsBox( tc, fc, t1, t2 );
        context.save();
        context.transform( 1, 0, 0, 1, -left, -top );
        context.strokeStyle = '#000000';
        MorphismElement.drawArrow( exit, enter, 20, context );
        context.stroke();
        context.restore();
    }
    // when editing, use one input for each defining feature
    createHtmlEditElement () {
        return $( '<p>Not yet implemented.</p>' );
    }
    // implement abstract methods save/loadEdits()
    saveEdits () {
        // fill in later
        this.reposition();
        this.model.sync();
    }
    loadEdits () {
        // fill in later
    }
    toString () {
        return `Morphism from ${this.from.toString()} to ${this.to.toString()}`;
    }
}
