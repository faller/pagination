//    pagination jumper v0.4
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery' ], factory );
    } else {
        // Browser globals
        factory( jQuery );
    }
})( function( $ ) {

    var NAMESPACE  = 'pJumper';

    var _template = [
        '<span class="tip text">',
            '共<span class="count">0</span>条, <span class="pageCount">0</span>页',
        '</span>',
        '<button class="next text">下一页</button>',
        '<span class="current text">',
            '第<input class="write text"><span class="read">0</span>页',
        '</span>',
        '<button class="prev text">上一页</button>'
    ].join( '' );

    var methods = {
        init: function( opts ) {
            var options = $.extend( { current:0, count:0 }, opts );
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
                    current: options.current,
                    count : options.count,
                    pageSize : options.pageSize,
                    silent: true
                });
            });
        },

        destroy: function() {
            return this.each( function() {
                var $this = $( this );
                // remove namespace
                $this.removeData( NAMESPACE );
                // remove child doms
                $this.empty();
            });
        },

        // key can be 'current', 'pageSize' or 'count'
        attr: function( key, value ) {
            return _attr.apply( $( this ), arguments );
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
            $data = that.data( NAMESPACE ),
            $prev = that.find( '.prev' ),
            $next = that.find( '.next' ),
            $tip = that.find( '.tip' ),
            $current = that.find( '.current' ),
            $currentRead = $current.find( '.read'),
            $currentWrite = $current.find( '.write' );
        $prev.on( 'click', function( event ) {
            _attr.call( that, 'current', $data.current - $data.pageSize );
        });
        $next.on( 'click', function( event ) {
            _attr.call( that, 'current', $data.current + $data.pageSize );
        });
        $currentRead.on( 'click', function( event ) {
            $currentRead.css( 'display', 'none' );
            $currentWrite.css( 'display', 'inline').focus();
        });
        $currentWrite.on( 'blur', function( event ) {
            $currentRead.css( 'display', 'inline' );
            $currentWrite.css( 'display', 'none' );
            _attr.call( that, 'current', ( $currentWrite.val() - 1 ) * $data.pageSize );
        });
        $currentWrite.on( 'keyup', function( event ) {
            if ( event.keyCode === 13 ) {
                _attr.call( that, 'current', ( $currentWrite.val() - 1 ) * $data.pageSize );
            }
            if ( ! /^\d+$/.test( $currentWrite.val() ) ) {
                $currentWrite.val( /^\d+/.exec( $currentWrite.val() ) );
            }
            return false;
        });
    };

    var _attr = function( key, value ) {
        var $data = this.data( NAMESPACE );
        if ( arguments.length === 1 && typeof key === 'string' ) {
            return $data[ key ];
        }

        var attrs = {};
        if ( arguments.length === 2 ) {
            attrs[ key ] = value;
        } else if ( arguments.length === 1 && typeof key === 'object' ) {
            attrs = key;
        }

        if ( attrs.count != null ) {
            $data.count = Math.max( attrs.count, 0 );
            if ( $data.count ) {
                this.css( 'display', 'block' );
                this.find( '.count' ).html( $data.count );
            } else {
                this.css( 'display', 'none' );
            }
        }

        if ( attrs.pageSize != null ) {
            $data.pageSize = Math.max( attrs.pageSize, 0 );
            this.find( '.pageCount' ).html( $data.count ? ( Math.floor( ( $data.count - 1 ) / $data.pageSize ) + 1 ) : 0 );
        }

        if ( attrs.current != null ) {
            $data.current = Math.max( attrs.current, 0 ) && Math.min( attrs.current, $data.count - 1 );
            var totalPage = $data.count ? ( Math.floor( ( $data.count - 1 ) / $data.pageSize ) + 1 ) : 0;
            var currentPage = totalPage ? ( Math.floor( $data.current / $data.pageSize ) + 1 ) : 0;
            this.find( '.prev' ).css( 'display', ( currentPage > 1 ) ? 'inline' : 'none' );
            this.find( '.next' ).css( 'display', ( currentPage < totalPage ) ? 'inline' : 'none' );
            this.find( '.current .read' ).html( currentPage );
            this.find( '.current .write' ).val( currentPage );
            // event bubbling
            attrs.silent || this.trigger( 'change:current', $data.current );
        }
    };

});