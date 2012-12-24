//    pagination slider v0.4
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'underscore', 'jquery.mousewheel', './jquery.drags' ], factory );
    } else {
        // Browser globals
        factory( jQuery, _ );
    }
})( function( $, _ ) {

    var NAMESPACE  = 'pSlider',
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
                    $data = $this.data( NAMESPACE );
                // If the plugin hasn't been initialized yet
                if ( !$data ) {
                    // add namespace
                    $this.data( NAMESPACE, {} );
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
                $this.removeData( NAMESPACE );
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

    $.fn[ NAMESPACE ] = function( method ) {
        if ( methods[ method ] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.' + NAMESPACE );
        }
    };

    var _bindEvents = function() {
        var that = this,
            $range = that.find( '.range' ),
            $current = that.find( '.current'),
            $data = that.data( NAMESPACE ),
            $parent = that.parent();

        $range.on( 'click', function( event ) {
            _move.call( that, ( ( event.pageY > $current.offset().top ) ? 1 : -1 ) * $data.limit );
        }).on( 'click', '.current', function( event ) {
            event.stopPropagation();    // excluding the click within current
        });

        // jquery drags plugin was needed
        $current.drags({
            axis: 'y',
            during: ( function() {
                var internal = _.throttle( function( $data, scale ){
                    var start= Math.min( Math.round( scale.y * $data.total ), $data.total - $data.limit );
                    // change tip
                    _tip.call( this, start );
                    $data.start = start;
                    // event bubbling
                    this.trigger( 'change:start', start );
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
            $data = this.data( NAMESPACE );
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
            $data = this.data( NAMESPACE );
        $head.html( count );
        $tail.html( Math.min( count + $data.limit, Math.round( $data.total ) ) );
    };

});
