
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
            ( e ) => $( e.htmlElement() ).css( 'z-index' ) ) );
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
            $( sheetElt.htmlElement().parentNode ).hasClass( selectedForDraggingClass ) );
    }

    // Ensure that the children of the view are precisely the set of DIVs placed there
    // by wrapping each SheetElement's htmlElement() in a DIV.
    sync () {
        var that = this;
        // Delete any elements that don't belong
        Array.from( this.view.childNodes ).map( function ( htmlElt ) {
            if ( !that.elements.find( ( sheetElt ) => htmlElt.childNodes[0] == sheetElt.htmlElement() ) ) {
                htmlElt.parentNode.removeChild( htmlElt );
            }
        } );
        // Ensure all Sheet Elements have their HTML element in the view
        this.elements.map( function ( sheetElt ) {
            var htmlElt = sheetElt.htmlElement();
            if ( !htmlElt.parentNode || htmlElt.parentNode.parentNode != that.view ) {
                var wrapper = that.view.ownerDocument.createElement( 'div' );
                wrapper.appendChild( htmlElt );
                $( wrapper ).draggableAndSizable();
                $( wrapper ).css( { position : 'absolute', padding : `${defaultResizingMargin}px` } );
                that.view.appendChild( wrapper );
            }
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
    }

    // This object can create (and later return) an HTML element representing itself.
    // This function does that, delegating the creation work to a createHtmlElement()
    // function that subclasses can override without having to reimplement the
    // caching behavior implemented here.
    htmlElement () {
        if ( !this.hasOwnProperty( 'viewElement' ) )
            this.viewElement = this.createHtmlElement();
        return this.viewElement;
    }

    // See above for explanation of this function.
    // It should be called only by htmlElement(), never by the client.
    // Thus it is called but once per SheetElement instance.
    createHtmlElement () {
        // This is a stub implementation that subclasses should override.
        return this.model.view.ownerDocument.createElement( 'div' );
    }

    // Removes this element from the model and its HTML element from the model's view
    remove () {
        var index = this.model.elements.indexOf( this );
        this.model.elements.splice( index, 1 );
        var wrapper = this.htmlElement().parentNode;
        wrapper.parentNode.removeChild( wrapper );
    }
}

/*
 * Simplest SheetElement subclass: a colored rectangle.
 */
class RectangleElement extends SheetElement {
    // only defining feature: background color
    constructor ( model ) {
        super( model );
        this.color = '#ddd';
        this.update();
    }
    // just represented by a div that fills its container and starts at size 100x100
    createHtmlElement () {
        var result = this.model.view.ownerDocument.createElement( 'div' );
        $( result ).css( {
            height: '100%',
            width : '100%',
            minWidth : '100px',
            minHeight : '100px'
        } );
        return result;
    }
    // update appearance with this function
    update () {
        $( this.htmlElement() ).css( { backgroundColor : this.color } );
    }
}
