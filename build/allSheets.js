
/*
 * This file adds an extension to jQuery for making elements movable and resizable,
 * by clicking and dragging with the mouse.
 *
 * To use: $(element).draggableAndSizable();
 * Result: When the user hovers the mouse over such an element, the cursor
 * changes to either a 4-way move cursor (in the element's center) or an
 * appropriate resizing arrow if near the element's margin.  At such a time,
 * clicking and dragging will either move the element or resize it, as the
 * cursor indicates.  Resizing can be in any of the 8 directions typical in
 * GUIs (top NS, bottom NS, left EW, right EW, top right NESW, etc.).
 */

// Set the distance from the edge of the element that counts as the resizing area.
const defaultResizingMargin = 10;

// Use the following class to mark an element the user has selected for dragging
// or resizing.  The user cannot drag or resize an element they have not first
// clicked to select.  This lets the user interact with element content like buttons
// and controls without triggering a move/resize event by accident.
// The client should typically assign this some style to make it obvious that the
// element has been selected, such as "border: 2px dotted #aaf;".
const selectedForDraggingClass = 'selected-for-moving-and-sizing';

// For temporarily pausing this feature.
const pausedDragSelectClass = 'move-and-size-on-pause';

// An internal convenience function that takes any mouse event and computes which
// region of the element's 9-patch it falls in (0=NW corner, 1=N strip, 2=NE corner,
// 3=W strip, 4=center block, etc.).
function eventToCellNumber ( event, relativeToThisAncestor ) {
    var container = relativeToThisAncestor || event.target;
    var min = { x : 0, y : 0 },
        max = { x : $( container ).outerWidth(), y : $( container ).outerHeight() },
        point = { x : event.pageX - container.offsetLeft,
                  y : event.pageY - container.offsetTop },
        col = ( point.x < min.x + defaultResizingMargin ) ? 0
            : ( point.x > max.x - defaultResizingMargin ) ? 2 : 1,
        row = ( point.y < min.y + defaultResizingMargin ) ? 0
            : ( point.y > max.y - defaultResizingMargin ) ? 2 : 1;
    return col + 3 * row;
}

// Now install the draggableAndSizable extension.
// Recall that in jQuery, an extension is a function that is called in all jQuery
// objects to which clients have applied it.  That is, it's run with "this" set to
// an element that needs draggableAndSizable applied to it.
$.fn.draggableAndSizable = function () {

    // Remember the element for use in all the closures below.
    // Store in that element an empty object we will fill with data during a drag/resize.
    var $element = this;
    $element[0].dragData = { };

    // Respond to clicks by toggling whether the element is selected.
    // Do this only if the click was not the end of a drag, by checking for motion.
    // We also trigger a mousemove event to update the cursor.
    $element.on( "click", function ( event ) {
        if ( $element.hasClass( pausedDragSelectClass ) ) return;
        if ( $element[0].dragData.firstX == $element[0].dragData.lastX
          && $element[0].dragData.firstY == $element[0].dragData.lastY ) {
            if ( $element.hasClass( selectedForDraggingClass ) ) {
                $element.removeDragAndSizeSelection();
            } else {
                $element.addDragAndSizeSelection();
            }
            setTimeout( function () {
                var mouseMoveEvent = $.Event( 'mousemove' );
                mouseMoveEvent.pageX = event.pageX;
                mouseMoveEvent.pageY = event.pageY;
                $element.trigger( mouseMoveEvent );
            }, 0 );
        }
    } );

    // When the mouse moves anywhere on a selected element, set the element's cursor
    // to indicate which kind of move or resize would happen if the usre clicked.
    $element.on( "mousemove", function ( event ) {
        if ( $element.hasClass( pausedDragSelectClass ) ) return;
        if ( !$element.hasClass( selectedForDraggingClass ) ) {
            $element.css( { cursor : 'default' } );
            return;
        }
        switch ( eventToCellNumber( event, $element[0] ) ) {
            case 0 : case 8 : $element.css( { cursor : 'nwse-resize' } ); break;
            case 1 : case 7 : $element.css( { cursor : 'ns-resize' } ); break;
            case 2 : case 6 : $element.css( { cursor : 'nesw-resize' } ); break;
            case 3 : case 5 : $element.css( { cursor : 'ew-resize' } ); break;
            case 4 : $element.css( { cursor : 'move' } ); break;
            default : $element.css( { cursor : 'default' } );
        }
    } );

    // When the user presses the mouse button down on a selected element, this begins a
    // move or resize event.  Thus we populate the element's dragData object with all the
    // data we will need to remember so that we can do relative positioning correctly later.
    // We also install in the parent element mouse handlers for continuing/ending the drag.
    $element.on( "mousedown", function ( event ) {
        if ( $element.hasClass( pausedDragSelectClass ) ) return;
        if ( !$element.hasClass( selectedForDraggingClass ) ) return;
        $element[0].dragData.type = eventToCellNumber( event, $element[0] );
        $element[0].dragData.firstX = event.pageX;
        $element[0].dragData.firstY = event.pageY;
        $element[0].dragData.lastX = event.pageX;
        $element[0].dragData.lastY = event.pageY;
        $element.parents().on( "mousemove", handleDrag );
        $element.parents().on( "mouseup", endDrag );
    } );

    // This internal helper function lets us know whether a proposed new position for the
    // element is "OK" (meaning it is within its parent's bounds).  This is used below to
    // check to be sure the user isn't dragging the item off screen where it would become
    // inaccessible for later selection/dragging/etc.
    function positionIsOkay ( left, top, right, bottom ) {
        return ( right - left >= 3 * defaultResizingMargin )
            && ( bottom - top >= 3 * defaultResizingMargin )
            && ( left >= $element.parent().offset().left )
            && ( top >= $element.parent().offset().top )
            && ( right <= $element.parent().offset().left + $element.parent().width() )
            && ( bottom <= $element.parent().offset().top + $element.parent().height() );
    }

    // Convenience function for repositioning or resizing the element.
    // The caller passes deltas for (left,top) and (right,bottom) points.
    // A move is thus expressed as (dx,dy,dx,dy) and a resize as one of these:
    // (dx,0,0,0), (0,dy,0,0), (0,0,dx,0), (0,0,0,dy), (dx,dy,0,0), (0,0,dx,dy)
    // This takes action only to the degree permitted by positionIsOkay().
    function reposition ( dleft, dtop, dright, dbottom ) {
        var left = $element.offset().left,
            top = $element.offset().top,
            right = $element.offset().left + $element.innerWidth(),
            bottom = $element.offset().top + $element.innerHeight();
        while ( ( dleft || dright )
             && positionIsOkay( left + Math.sign( dleft ), top,
                                right + Math.sign( dright ), bottom ) ) {
            left += Math.sign( dleft );
            right += Math.sign( dright );
            dleft -= Math.sign( dleft );
            dright -= Math.sign( dright );
        }
        while ( ( dtop || dbottom )
             && positionIsOkay( left, top + Math.sign( dtop ),
                                right, bottom + Math.sign( dbottom ) ) ) {
            top += Math.sign( dtop );
            bottom += Math.sign( dbottom );
            dtop -= Math.sign( dtop );
            dbottom -= Math.sign( dbottom );
        }
        $element.offset( { left : left, top : top } );
        $element.innerWidth( right - left );
        $element.innerHeight( bottom - top );
    }

    // Responds to a mouse drag event by either moving or resizing the element,
    // via a call to reposition() with appropriate parameters.
    // We compute relative change since last drag by storing the last drag point
    // in the element's dragData object.
    function handleDrag ( event ) {
        var dx = event.pageX - $element[0].dragData.lastX,
            dy = event.pageY - $element[0].dragData.lastY,
            dleft = dx, dtop = dy, dright = dx, dbottom = dy;
        if ( $element[0].dragData.type != 4 ) {
            if ( $element[0].dragData.type > 2 ) dtop = 0;
            if ( $element[0].dragData.type < 6 ) dbottom = 0;
            if ( $element[0].dragData.type % 3 > 0 ) dleft = 0;
            if ( $element[0].dragData.type % 3 < 2 ) dright = 0;
        }
        reposition( dleft, dtop, dright, dbottom );
        $element[0].dragData.lastX = event.pageX;
        $element[0].dragData.lastY = event.pageY;
    }

    // When a drag ends, we uninstall the handlers we had to add to its parent.
    function endDrag () {
        $element.parents().off( "mousemove", handleDrag );
        $element.parents().off( "mouseup", endDrag );
    }
};

// How we add/remove dragging selections
$.fn.removeDragAndSizeSelection = function () {
    if ( this.hasClass( pausedDragSelectClass ) ) return;
    if ( this[0] ) this[0].dragData = { };
    this.removeClass( selectedForDraggingClass );
}
$.fn.addDragAndSizeSelection = function () {
    $( '.'+selectedForDraggingClass ).removeDragAndSizeSelection();
    this.addClass( selectedForDraggingClass );
}

// You can pause and unpause this feature
$.fn.pauseDragAndResize = function () {
    this.addClass( pausedDragSelectClass );
}
$.fn.unpauseDragAndResize = function () {
    this.removeClass( pausedDragSelectClass );
}

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
    }

    // Add a Sheet Element to the model.
    // Don't call this directly; just construct the element with the model as parameter.
    addElement ( element ) {
        if ( !( element instanceof SheetElement ) )
            throw new Error( 'SheetModel.addElement accepts only SheetElements' );
        // get current max z-index so we can use it below
        const maxIndex = Math.max( ...this.elements.map(
            ( e ) => $( e.htmlViewElement() ).css( 'z-index' ) ) );
        // add element to internal array of elements
        this.elements.push( element );
        // ensure the new element has the highest z-index of all elements in the model
        $( element ).css( 'z-index', maxIndex + 1 );
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
                } );
                that.view.appendChild( wrapper );
            }
        } );
    }

    // Save the state of this entire sheet by creating an array of the JSON states of the
    // elements in the model.
    toJSON () {
        return this.elements.map( ( elt ) => elt.toJSON() );
    }
    // Restore the state from a previous save by destroying all existing content first,
    // then filling it anew with newly created instances based on the given data.  End
    // with a sync call.  Requires JSON in the format produced by toJSON(), above.
    fromJSON ( json ) {
        var that = this;
        this.elements = json.map( function ( eltJson ) {
            if ( !/^[a-zA-Z_][a-zA-Z_0-9]*$/.test( eltJson.className ) )
                throw new Error( `Invalid class name: ${eltJson.className}` );
            var ctor = eval( eltJson.className );
            var obj = new ctor( that );
            obj.fromJSON( eltJson );
            return obj;
        } );
        this.sync();
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
