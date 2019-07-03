//@flow
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

/*::
export type JQueryDnD = JQuery & {
   draggableAndSizable: () => void,
   removeDragAndSizeSelection: () => void,
   addDragAndSizeSelection: () => void,
   pauseDragAndResize: () => void,
   unpauseDragAndResize: () => void
};

*/
// Set the distance from the edge of the element that counts as the resizing area.
/*:: export */
const DEFAULT_RESIZING_MARGIN /*: number */ = 10;

// Use the following class to mark an element the user has selected for dragging
// or resizing.  The user cannot drag or resize an element they have not first
// clicked to select.  This lets the user interact with element content like buttons
// and controls without triggering a move/resize event by accident.
// The client should typically assign this some style to make it obvious that the
// element has been selected, such as "border: 2px dotted #aaf;".
/*:: export */
const SELECTED_FOR_DRAGGING_CLASS /*: string */ = 'selected-for-moving-and-sizing';

// For temporarily pausing this feature.
const pausedDragSelectClass = 'move-and-size-on-pause';

// An internal convenience function that takes any mouse event and computes which
// region of the element's 9-patch it falls in (0=NW corner, 1=N strip, 2=NE corner,
// 3=W strip, 4=center block, etc.).
function eventToCellNumber ( event, relativeToThisAncestor ) {
    var container = relativeToThisAncestor || event.target;
    var min = { x : 0, y : 0 },
        max = { x : $( container ).outerWidth(), y : $( container ).outerHeight() },
        rect = container.getBoundingClientRect(),
        point = { x : event.pageX - rect.left,
                  y : event.pageY - rect.top },
        col = ( point.x < min.x + DEFAULT_RESIZING_MARGIN ) ? 0
            : ( point.x > max.x - DEFAULT_RESIZING_MARGIN ) ? 2 : 1,
        row = ( point.y < min.y + DEFAULT_RESIZING_MARGIN ) ? 0
            : ( point.y > max.y - DEFAULT_RESIZING_MARGIN ) ? 2 : 1;
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
            if ( $element.hasClass( SELECTED_FOR_DRAGGING_CLASS ) ) {
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
        if ( !$element.hasClass( SELECTED_FOR_DRAGGING_CLASS ) ) {
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
        if ( !$element.hasClass( SELECTED_FOR_DRAGGING_CLASS ) ) return;
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
        return ( right - left >= 3 * DEFAULT_RESIZING_MARGIN )
            && ( bottom - top >= 3 * DEFAULT_RESIZING_MARGIN )
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
        $element[0].dispatchEvent( new CustomEvent(
            ( $element[0].dragType == 4 ) ? 'moved' : 'resized',
            { bubbles : true } ) );
    }
};

// How we add/remove dragging selections
$.fn.removeDragAndSizeSelection = function () {
    if ( this.hasClass( pausedDragSelectClass ) ) return;
    if ( this[0] ) this[0].dragData = { };
    this.removeClass( SELECTED_FOR_DRAGGING_CLASS );
    if ( this[0] ) this[0].dispatchEvent( new CustomEvent( 'deselected', { bubbles : true } ) );
}
$.fn.addDragAndSizeSelection = function () {
    (($( '.'+SELECTED_FOR_DRAGGING_CLASS ) /*: any */) /*: JQueryDnD */).removeDragAndSizeSelection();
    this.addClass( SELECTED_FOR_DRAGGING_CLASS );
    if ( this[0] ) this[0].dispatchEvent( new CustomEvent( 'selected', { bubbles : true } ) );
}

// You can pause and unpause this feature
$.fn.pauseDragAndResize = function () {
    this.addClass( pausedDragSelectClass );
}
$.fn.unpauseDragAndResize = function () {
    this.removeClass( pausedDragSelectClass );
}
