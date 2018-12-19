
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
        // update view
        this.sync();
    }

    // Find the currently selected element and return it as a SheetElement instance,
    // or undefined if there is none.
    selected () {
        return this.elements.find( ( sheetElt ) =>
            $( sheetElt.htmlViewElement().parentNode ).hasClass( selectedForDraggingClass ) );
    }

    // Ensure that the children of the view are precisely the set of DIVs placed there
    // by wrapping each SheetElement's htmlViewElement() in a DIV.
    sync () {
        var that = this;
        // Delete any elements that don't belong
        Array.from( this.view.childNodes ).map( function ( htmlElt ) {
            if ( !that.elements.find( ( sheetElt ) => htmlElt.childNodes[0] == sheetElt.htmlViewElement() ) ) {
                htmlElt.parentNode.removeChild( htmlElt );
            }
        } );
        // Ensure all Sheet Elements have their HTML element in the view
        this.elements.map( function ( sheetElt ) {
            var htmlElt = sheetElt.htmlViewElement();
            if ( !htmlElt.parentNode || htmlElt.parentNode.parentNode != that.view ) {
                var wrapper = $( '<div></div>' )[0];
                wrapper.appendChild( htmlElt );
                $( wrapper ).draggableAndSizable();
                $( wrapper ).css( {
                    position : 'absolute',
                    padding : `${defaultResizingMargin}px`,
                    "z-index" : sheetElt.zIndex
                } );
                that.view.appendChild( wrapper );
            }
        } );
        // While we're here, if anything changed since the last time we were here,
        // record it on the undo/redo stack.
        if ( this.undoRedoActive ) {
            setTimeout( function () { // ensure layout happens
                var last = that.history[that.historyIndex];
                var next = JSON.stringify( that.toJSON() );
                if ( next != last ) {
                    that.history = that.history.slice( 0, that.historyIndex + 1 );
                    that.history.push( next );
                    that.historyIndex++;
                    if ( that.history.length > that.maxHistorySize ) {
                        that.history.shift();
                        that.historyIndex--;
                    }
                }
            }, 1 );
        }
        this.view.dispatchEvent( new CustomEvent( 'synced', { bubbles : true } ) );
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
    toJSON () {
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
        this.elements = json.map( function ( eltJson ) {
            return that.sheetElementFromJSON( eltJson );
        } );
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
        result.fromJSON( json );
        return result;
    }

    // Do the rectangles of these two sheet elements intersect?
    intersect ( elt1, elt2 ) {
        var $elt1 = $( elt1.htmlViewElement().parentNode ),
            $elt2 = $( elt2.htmlViewElement().parentNode ),
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
            $( element.htmlViewElement().parentNode )
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
    }

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
        var index = this.model.elements.indexOf( this );
        this.model.elements.splice( index, 1 );
        var wrapper = this.htmlViewElement().parentNode;
        wrapper.parentNode.removeChild( wrapper );
        this.model.sync();
    }

    // Enter edit mode by swapping the view and the edit controls in the wrapper.
    edit () {
        var viewer = this.htmlViewElement();
        var editor = this.htmlEditElement();
        if ( editor.parentNode != viewer.parentNode )
            viewer.parentNode.appendChild( editor );
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
        $( this.htmlEditElement().parentNode ).removeDragAndSizeSelection();
        $( this.htmlEditElement().parentNode ).pauseDragAndResize();
    }
    // Reverse of the previous
    showViewControls () {
        $( this.htmlViewElement() ).show();
        $( this.htmlEditElement() ).hide();
        $( this.htmlEditElement().parentNode ).unpauseDragAndResize();
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
        if ( !view[0].parentNode ) return;
        $( view[0].parentNode ).width( view.width() ).height( view.height() );
    }

    // Subclasses should override this to create an actual object representing the
    // instance.  Always include the class name.  Feel free to start with this object
    // and then alter/extend.
    toJSON () {
        var $wrapper = $( this.htmlViewElement().parentNode );
        return {
            className : 'SheetElement',
            x : $wrapper.offset().left,
            y : $wrapper.offset().top,
            w : $wrapper.width(),
            h : $wrapper.height(),
            z : $wrapper.css( 'z-index' )
        };
    }
    // The reverse of the above method is this one.  It presumes that the class of
    // this instance is equal to json.className, and then extracts all relevant data
    // from the parameter to re-establish the saved state.  Again, subclasses should
    // override and can feel free to call this method as part of their work.
    fromJSON ( json ) {
        var $wrapper = $( this.htmlViewElement().parentNode );
        $wrapper.offset( { left : json.x, top : json.y } )
                .width( json.w ).height( json.h )
                .css( { "z-index" : json.z } );
    }
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
}
