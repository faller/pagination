//     simple drags within parent v0.3
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.

(function( win, doc, $, undefined ) {
    $.fn.drags = function( opts ) {
        var options = $.extend( {}, opts );
        return this.each( function() {
            var $this = $( this),
                isDragging = false,
                eventBefore, self, parent;
            $this.on( "mousedown" , function( event ) {
                isDragging = true;
                $this.parent().addClass( 'dragging' );
                eventBefore = event;
                self = { height: $this.height(), width: $this.width(), position: $this.position() };
                parent = { height: $this.parent().height(), width: $this.parent().width() };
                // prevent text selection (except IE)
                event.preventDefault();
                // prevent text selection in IE
                doc.onselectstart = function () { return false; };
            });
            $( doc ).on( "mouseup", function() {
                if ( !isDragging ) return;
                isDragging = false;
                $this.parent().removeClass( 'dragging' );
                // enable IE text selection
                doc.onselectstart = null;
            }).on( "mousemove", function( event ) {
                if ( !isDragging ) return;
                var scale = {}, bubbleScale = {};
                if ( options.axis !== 'x' ) {
                    var delta = event.pageY - eventBefore.pageY;
                    var goal = self.position.top + delta;
                    var top = Math.max( goal, 0 ) && Math.min( goal, parent.height - self.height );
                    scale.y = top / parent.height;
                    bubbleScale.y = ( goal > parent.height ) ? 1 : scale.y;
                }
                if ( options.axis !== 'y' ) {
                    var delta = event.pageX - eventBefore.pageX;
                    var goal = self.position.left + delta;
                    var left = Math.max( goal, 0 ) && Math.min( goal, parent.width - self.width );
                    scale.x = left / parent.width;
                    bubbleScale.x = ( goal > parent.width ) ? 1 : scale.x;
                }
                $this.css({
                    top: ( scale.y === undefined ) ? undefined : scale.y * 100 + '%',
                    left : ( scale.x === undefined ) ? undefined : scale.x * 100 + '%'
                });
                if ( $.isFunction( options.during ) ) {
                    options.during( bubbleScale );
                }
            });
        });
    };
})( window, document, jQuery );
