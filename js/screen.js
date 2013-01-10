//    pagination screen v0.4
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'underscore' ], factory );
    } else {
        // Browser globals
        factory( jQuery, _ );
    }
})( function( $, _ ) {

    var NAME_SPACE     = 'pScreen',
        PAGE_ID_PREFIX = 'page-',
        DEBOUNCE_RATE  = 500;   // prevent frequently fetch

    var methods = {
        init: function( opts ) {
            var options = $.extend( { pageSize: 10, buffered: true, bufferPageAmount: 2, initPageAmount: 1 }, opts );
            return this.each( function() {
                var $this = $( this ),
                    $data = $this.data( NAME_SPACE );
                // If the plugin hasn't been initialized yet
                if ( !$data ) {
                    $data = {};
                    // add namespace
                    $this.data( NAME_SPACE, $data );
                    // add doms if not exist
                    $this.parent().find( '.overlay' ).length || $this.parent().append( '<div class="overlay"></div>' );
                    // bind events
                    _bindEvents.call( $this );
                }
                $.extend( $data, {
                    dataSource: _dataSourceTransformer( options.dataSource ),
                    params: options.params,
                    method: options.method,
                    success: options.success,
                    error: options.error,
                    render: options.render,
                    pageSize: options.pageSize,
                    initPageAmount: options.initPageAmount,
                    buffered: options.buffered,
                    bufferPageAmount: options.bufferPageAmount
                });
                _reload.call( $this );
            });
        },

        destroy: function() {
            return this.each( function() {
                var $this = $( this );
                // remove event handlers
                $this.parent().off( 'click', '.item' );
                // remove namespace
                $this.removeData( NAME_SPACE );
                // remove child doms
                $this.empty();
            });
        },

        render: function( callback ) {
            if ( callback ) {
                return this.each( function() {
                    $( this ).data( NAME_SPACE ).render = callback;
                });
            } else {
                return this.data( NAME_SPACE ).render;
            }
        },

        dataSource: function( dataSource ) {
            if ( dataSource ) {
                dataSource = _dataSourceTransformer( dataSource );
                return this.each( function() {
                    var $this = $( this );
                    $this.data( NAME_SPACE ).dataSource = dataSource;
                    _reload.call( $this );
                });
            } else {
                return this.data( NAME_SPACE ).dataSource;
            }
        },

        params: function( params ) {
            if ( params ) {
                return this.each( function() {
                    var $this = $( this );
                    $this.data( NAME_SPACE ).params = params;
                    _reload.call( $this );
                });
            } else {
                return this.data( NAME_SPACE ).params;
            }
        },

        select: function( selections ) {
            if ( selections != null ) {
                return this.each( function() {
                    var $this = $( this );
                    $this.find( '.item' ).removeClass( 'selected' );
                    _.isArray( selections ) || ( selections = [ selections ] );
                    if ( _.isEmpty( selections ) ) return;
                    var selector = _.reduce( _.map( selections , function( selection ) {
                        return '.item:eq(' + selection + ')';
                    }), function( memo, value ){
                        return memo + ',' + value;
                    });
                    $this.find( selector ).addClass( 'selected' );
                });
            } else {
                return this.find( '.selected' );
            }
        },

        // set or get the location
        // params eg. 99
        // screen content will shift to the given location
        locate: function( location ) {
            if ( location != null ) {
                return this.each( function() {
                    var $this = $( this );
                    _locate.call( $this, location );
                });
            } else {
                return this.find( '.pointed' );
            }
        },

        // locate to the next page
        nextPage: function() {
            return this.each( function() {
                var $this = $( this ),
                    $data = $this.data( NAME_SPACE ),
                    pageMapping = $data.pageMapping,
                    $currentPage = pageMapping.currentPage;
                if ( !$currentPage ) {
                    _reload.call( $this );
                } else {
                    var location = ( _pageNumber( $currentPage ) + 1 ) * $data.pageSize;
                    _locate.call( $this, location );
                }
            });
        },

        // locate to the previous page
        prevPage: function() {
            return this.each( function() {
                var $this = $( this ),
                    $data = $this.data( NAME_SPACE ),
                    pageMapping = $data.pageMapping,
                    $currentPage = pageMapping.currentPage;
                if ( !$currentPage ) {
                    _reload.call( $this );
                } else {
                    var location = ( _pageNumber( $currentPage ) - 1 ) * $data.pageSize;
                    _locate.call( $this, location );
                }
            });
        },

        reload: function() {
            return this.each( function() {
                _reload.call( $( this ) );
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
        // delegate event to 'parent' so user could have chance to stop event bubbling
        this.parent().on( 'click', '.item', function( event ) {
            $( this ).toggleClass( 'selected' );
        });
    };

    var _reload = function() {
        // empty container, create and complete page, locate 0
        var that = this,
            $data = that.data( NAME_SPACE ),
            pageMapping = $data.pageMapping = {};

        that.find( '.page' ).remove();
        $data.count = null;
        $data.buffer = {};
        if ( !$data.dataSource ) return;
        var $page = _createPage.call( that, 0 );
        pageMapping.currentPage = $page.removeClass( 'hidden' );
        _setOverlay.call( that, 'empty', 'remove' );
        _setOverlay.call( that, 'error', 'remove' );
        _completePage.call( that, $page, function() {
            _locate.call( that, 0 );
        });
    };

    var _locate = ( function() {
        var _getContext = function( location ) {
            var $data = this.data( NAME_SPACE ),
                pageMapping = $data.pageMapping,
                $currentPage = pageMapping.currentPage;
            return ( !$currentPage ) ? null : {
                that: this,
                location: location,
                pageMapping: pageMapping,
                buffered: $data.buffered,
                pageSize: $data.pageSize,
                count: $data.count,
                targetPageNumber: Math.floor( location / $data.pageSize ),
                currentPageNumber: _pageNumber( $currentPage )
            };
        };

        var _debounceCreatePage = _.debounce( function( pageNumber, callback ){
            callback( _createPage.call( this, pageNumber ) );
        }, DEBOUNCE_RATE );

        var _fixCurrentPage = function( context ) {
            context.buffered ? context.pageMapping.currentPage.addClass( 'hidden' ) : (
                delete context.pageMapping[ context.currentPageNumber ],
                context.pageMapping.currentPage.remove()
            );
            context.pageMapping.currentPage = context.pageMapping[ context.targetPageNumber ].removeClass( 'hidden' );
        };

        var _pointItem = function( context ) {
            context.pageMapping.currentPage.find( '.item' ).eq( context.location % context.pageSize ).addClass( 'pointed' );
        };

        var _findPage = function( context ) {
            if ( context.buffered ) {
                context.pageMapping.lastPageNumber = context.currentPageNumber;
            }
            var $targetPage = context.pageMapping[ context.targetPageNumber ];
            if ( $targetPage ) {
                _fixCurrentPage( context );
                _pointItem( context );
            } else {
                _debounceCreatePage.call( context.that, context.targetPageNumber, function( $page ) {
                    _completePage.call( context.that, $page, function( $page ) {
                        _fixCurrentPage( context );
                        _pointItem( context );
                    });
                });
            }
        };

        return function( location ) {
            var context = _getContext.call( this, location );
            if ( !context ) return _reload.call( this );
            if ( !_.isFinite( context.targetPageNumber ) || location < 0 || location > context.count ) return;
            context.pageMapping.currentPage.find( '.pointed' ).removeClass( 'pointed' );
            context.targetPageNumber === context.currentPageNumber ? _pointItem( context ) : _findPage( context );
        };

    })();

    var _createPage = function( pageNumber ) {
        var tagName = ( this.prop( 'tagName' ).toLowerCase() === 'table' ) ? 'tbody' : 'div';
        var $page = $( '<' + tagName + ' class="page hidden"></' + tagName + '>' );
        $page.attr( 'id', PAGE_ID_PREFIX + pageNumber );
        this.append( $page );
        this.data( NAME_SPACE ).pageMapping[ pageNumber ] = $page;
        return $page;
    };

    var _completePage = function( $page, callback ) {
        var that = this,
            $data = that.data( NAME_SPACE ),
            pageSize = $data.pageSize,
            pageNumber = _pageNumber( $page ),
            inited = ( $data.count != null );

        var params = _.extend({
            skip: pageNumber * $data.pageSize,
            limit: inited ? $data.pageSize : ( $data.pageSize * $data.initPageAmount ),
            count: !inited
        }, $data.params );

        var success = function( data ) {
            _.isFunction( $data.success ) && $data.success( data );
            if ( _.isEmpty( data.list ) && !inited ) {
                return empty();
            }
            var size = 0;
            _processLargeArray( data.list, function( item ) {
                if ( size < pageSize ) {
                    var $dom = $( $data.render( item, pageNumber, size++ ) ).addClass( 'item' );
                    $page.append( $dom );
                } else if ( !$data.pageMapping[ ++pageNumber ] ) {
                    $page = _createPage.call( that, pageNumber );
                    size = 0;
                    return arguments.callee( item );
                } else {
                    return false;  // break processLargeArray
                }
            }, function() {
                _setOverlay.call( that, 'loading', 'remove' );
                if ( data.count != null ) {
                    $data.count = data.count;
                    that.trigger( 'reload', {
                        pageSize: $data.pageSize,
                        count: $data.count
                    });
                }
                _.isFunction( callback ) && callback( $page );
            });
        };

        var empty = function() {
            _setOverlay.call( that, 'loading', 'remove' );
            _setOverlay.call( that, 'empty' );
        };

        var error = function() {
            _setOverlay.call( that, 'loading', 'remove' );
            _setOverlay.call( that, 'error' );
            _.isFunction( $data.error ) && $data.error();
        };

        _setOverlay.call( that, 'loading' );
        _fetchData.call( that, params, success, error );
    };

    var _setOverlay = function( className, operation ) {
        var $overlay = this.parent().find( '.overlay' );
        if ( operation === 'remove' ) {
            $overlay.removeClass( className );
        } else {
            $overlay.addClass( className );
            var parentHeight = this.parent().outerHeight();
            $overlay.css( 'height', parentHeight ? parentHeight + 'px' : '300px' );
        }
    };

    var _fetchData = (function() {
        var _doFetch = function( dataSource, params, method, success, error ) {
            dataSource({
                params: params,
                method: method,
                success: success,
                error: error
            });
        };

        var _prepareBuffer = function( params ) {
            var $data = this.data( NAME_SPACE ),
                pageSize = $data.pageSize,
                bufferPageAmount = $data.bufferPageAmount,
                pageMapping = $data.pageMapping,
                buffer = $data.buffer;
                maxPageNumber = Math.floor( $data.count - 1 / pageSize ),
                currentPageNumber = Math.floor( params.skip / pageSize ),
                lastPageNumber = pageMapping.lastPageNumber;
            if ( params.skip === 0 ) return;
            var direction = currentPageNumber - lastPageNumber;
            if ( direction === 1 || direction === -1 ) {
                for ( var i = 0; i < bufferPageAmount; i++ ) {
                    (function( bufferPageNumber ){
                        if ( bufferPageNumber >= 0 && bufferPageNumber <= maxPageNumber && !buffer[bufferPageNumber] && !pageMapping[ bufferPageNumber ] ) {
                            var tempParams = _.clone( params );
                            tempParams.skip = pageSize * bufferPageNumber;
                            _doFetch( $data.dataSource, tempParams, $data.method, function( data ) {
                                buffer[ bufferPageNumber ] = data;
                            });
                        }
                    })( currentPageNumber + ( i + 1 ) * direction );
                }
            }
        };

        return function( params, success, error ) {
            var that = this,
                $data = that.data( NAME_SPACE );
            if ( $data.buffered ) {
                var buffer = $data.buffer,
                    currentPageNumber = Math.floor( params.skip / $data.pageSize);
                if ( buffer && buffer[ currentPageNumber ] ) {
                    success( buffer[ currentPageNumber ] );
                    delete buffer[ currentPageNumber ];
                    _prepareBuffer.call( that, params );
                } else {
                    _doFetch( $data.dataSource, params, $data.method, function( data ) {
                        success( data );
                        _prepareBuffer.call( that, params );
                    }, error );
                }
            } else {
                _doFetch( $data.dataSource, params, $data.method, success, error );
            }
        };
    })();

    var _dataSourceTransformer = function( dataSource ) {
        return !dataSource || _.isFunction( dataSource ) ? dataSource : function( args ) {
            $.ajax({
                url: dataSource,
                data: args.params,
                type: args.method ? args.method.toUpperCase() : 'GET',
                success: args.success,
                error: args.error,
                dataType: 'json',
                cache: false
            });
        };
    };

    var _pageNumber = function( $page ) {
        return parseInt( $page.attr( 'id' ).substring( PAGE_ID_PREFIX.length ) );
    };

    var _processLargeArray = (function() {
        var maxtime = 100;
        var delay = 20;
        return function( array, handler, callback ) {
            var i = 0, length = array.length;
            setTimeout( function() {
                var endtime = new Date().getTime() + maxtime;
                while ( i < length && endtime > new Date().getTime() ) {
                    var result = handler( array[ i ], i, array );
                    i = ( result === false ) ? length : ++i;
                };
                if ( i < length ) {
                    setTimeout( arguments.callee, delay );
                } else {
                    if ( _.isFunction( callback ) ) callback();
                }
            }, 0 );
        };
    })();

});
