//    pagination slider v0.4
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'underscore', 'jquery-mousewheel' ], factory );
    } else {
        // Browser globals
        factory( jQuery, _ );
    }
})( function( $, _ ) {

    var NAME_SPACE = 'pSlider',
        EVENT_RATE = 200;

    var _template = [
        '<div class="range">',
            '<div class="bg">',
                '<div class="head"></div>',
                '<div class="tail"></div>',
            '</div>',
            '<div class="current">',
                '<div class="head">',
                    '<div class="tip"></div>',
                '</div>',
                '<div class="tail">',
                    '<div class="tip"></div>',
                '</div>',
            '</div>',
        '</div>'
    ].join( '' );

    var methods = {
        init: function( opts ) {
            var options = $.extend( { start:0, limit:10, total:0 }, opts );
            return this.each( function() {
                var $this = $( this ),
                    $data = $this.data( NAME_SPACE );
                // If the plugin hasn't been initialized yet
                if ( !$data ) {
                    // add namespace
                    $this.data( NAME_SPACE, {} );
                    // add doms if not exist
                    $this.children().length || $this.html( _template );
                    // bind events
                    _bindEvents.call( $this );
                }
                _attr.call( $this, {
                    start : options.start,
                    limit : options.limit,
                    total : options.total,
                    silent: true
                });
            });
        },

        destroy: function() {
            return this.each( function() {
                var $this = $( this );
                // remove event handlers
                $this.parent().off( 'mousewheel' );
                // remove namespace
                $this.removeData( NAME_SPACE );
                // remove child doms
                $this.empty();
            });
        },

        // key can be 'start', 'limit' or 'total'
        attr: function( key, value ) {
            return _attr.apply( $( this ), arguments );
        },

        // move the slider by the given step ( eg. -1, 1 )
        move: function( step ) {
            return this.each( function() {
                _move.call( $( this ), step );
            });
        }
    };

    $.fn[ NAME_SPACE ] = function( method ) {
        if ( methods[ method ] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.' + NAME_SPACE );
        }
    };

    var _bindEvents = function() {
        var that = this,
            $range = that.find( '.range' ),
            $current = that.find( '.current'),
            $data = that.data( NAME_SPACE ),
            $parent = that.parent();

        $range.on( 'click', function( event ) {
            _move.call( that, ( ( event.pageY > $current.offset().top ) ? 1 : -1 ) * $data.limit );
        }).on( 'click', '.current', function( event ) {
            event.stopPropagation();    // excluding the click within current
        });

        // this plugin was defined below
        $current.pDrags({
            axis: 'y',
            during: ( function() {
                var internal = _.throttle( function( $data, scale ) {
                    var goal = Math.round( scale.y * $data.total );
                    if ( goal === $data.total && $data.start >= $data.total - $data.limit ) {
                        // let user reach bottom to the greatest extent
                        goal = Math.min( $data.start + 1, $data.total - 1 );
                    } else {
                        // normal drags
                        goal = Math.min( goal, $data.total - $data.limit );
                    }
                    // change tip
                    _tip.call( this, goal );
                    $data.start = goal;
                    // event bubbling
                    this.trigger( 'change:start', goal );
                }, EVENT_RATE );
                return function( scale ) {
                    internal.call( that, $data, scale );
                };
            })()
        });

        // jquery mousewheel plugin was needed
        $parent.on( 'mousewheel', function( event, delta ) {
            if ( delta > 0 ) {
                _move.call( that, -1 );
            } else if ( delta < 0 ) {
                _move.call( that, 1 );
            }
            event.preventDefault();
        });

        // simulate ':hover' for ie6
        var ie6 = !-[1,]&&!window.XMLHttpRequest;    // $.browser.version == "6.0" may not be ie6
        if ( ie6 ) {
            _.each( [ that, $parent ], function( $dom ) {
                $dom.hover( function( event ) {
                    $( this ).addClass( 'ie6-hover' );
                }, function( event ) {
                    $( this ).removeClass( 'ie6-hover' );
                });
            });
        }
    };

    var _attr = function( key, value ) {
        var $current = this.find( '.current' ),
            $data = this.data( NAME_SPACE );
        if ( arguments.length === 1 && typeof key === 'string' ) {
            return $data[ key ];
        }

        var attrs = {};
        if ( arguments.length === 2 ) {
            attrs[ key ] = value;
        } else if ( arguments.length === 1 && typeof key === 'object' ) {
            attrs = key;
        }

        if ( attrs.total != null ) {
            $data.total = Math.max( attrs.total, 0.0000001 );     // avoid NaN
            this.css( 'display', ( $data.total < 1 ) ? 'none' : 'block' );
            if ( attrs.limit == null ) {
                attrs.limit = $data.limit;     // to trigger next if
            }
        }

        if ( attrs.limit != null ) {
            $data.limit = Math.max( attrs.limit, 0 );
            if ( attrs.start == null ) {
                attrs.start = $data.start;     // to trigger next if
            }
            $current.css( 'height', Math.min( $data.limit / $data.total, 1 ) * 100 + '%' );
        }

        if ( attrs.start != null ) {
            $data.start = Math.max( attrs.start, 0 );
            $data.start = Math.min( $data.start, $data.total - 1 );
            $current.css( 'top', Math.min( $data.start, Math.max( $data.total - $data.limit, 0 ) ) / $data.total * 100 + '%' );
            _tip.call( this, $data.start );
            // event bubbling
            attrs.silent || this.trigger( 'change:start', $data.start );
        }
    };

    var _move = function( step ) {
        var before, goal;
        before = _attr.call( this, 'start' );
        goal = step + before;
        _attr.call( this, 'start', goal );
    };

    var _tip = function ( count ) {
        var $head = this.find( '.current .head .tip' ),
            $tail = this.find( '.current .tail .tip' ),
            $data = this.data( NAME_SPACE );
        $head.html( count );
        $tail.html( Math.min( count + $data.limit, Math.round( $data.total ) ) );
    };

    // simple drags within parent
    $.fn.pDrags = function( opts ) {
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
                document.onselectstart = function () { return false; };
            });
            $( document ).on( "mouseup", function() {
                if ( !isDragging ) return;
                isDragging = false;
                $this.parent().removeClass( 'dragging' );
                // enable IE text selection
                document.onselectstart = null;
            }).on( "mousemove", function( event ) {
                if ( !isDragging ) return;
                var scale = {}, bubbleScale = {};
                if ( options.axis !== 'x' ) {
                    var delta = event.pageY - eventBefore.pageY;
                    var goal = self.position.top + delta;
                    var top = Math.max( goal, 0 ) && Math.min( goal, parent.height - self.height );
                    scale.y = top / parent.height;
                    bubbleScale.y = ( goal > parent.height - self.height ) ? 1 : scale.y;
                }
                if ( options.axis !== 'y' ) {
                    var delta = event.pageX - eventBefore.pageX;
                    var goal = self.position.left + delta;
                    var left = Math.max( goal, 0 ) && Math.min( goal, parent.width - self.width );
                    scale.x = left / parent.width;
                    bubbleScale.x = ( goal > parent.width - self.width ) ? 1 : scale.x;
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

});
