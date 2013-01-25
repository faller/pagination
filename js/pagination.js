//    pagination v0.4.1
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.
//
//    usage eg.
//    $( '#page' ).pagination({
//          dataSource: 'xxxx.action',                            // can be a url or a function of 'Mocker'
//          params: {                                             // params here will be passed to dataSource
//              query: 'type gte {a}, type lte {z}, time gt {0}',
//              sort: 'type asc, time desc'
//          },
//          method: 'GET',                                        // default: 'GET'
//          success: null,                                        // successCallback( data ), default: do nothing
//          error: null,                                          // errorCallback(), default: do nothing
//          render: renderCallback,                               // renderCallback( item, pageNumber, index ) which returns a dom element
//          mode: 'slider',                                       // try 'slider' in narrow space and 'jumper' in waterfall page
//          pageSize: 10,
//          initPageAmount: 1                                     // default: 1
//          buffered: true,                                       // smart enough to pre-read and cache data
//          bufferPageAmount: 2,                                  // default: 2
//    }

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'underscore', 'jquery-mousewheel' ], factory );
    } else {
        // Browser globals
        factory( jQuery, _ );
    }
})( function( $, _ ) {

    var methods = {
        init: function( opts ) {
            var options = $.extend( { mode: 'slider' }, opts );
            return this.each( function() {
                var $this = $( this );
                // If the plugin hasn't been initialized yet
                if ( !$this.hasClass( 'pagination' ) ) {
                    // add namespace
                    $this.addClass( 'pagination' ) ;
                    // add doms if not exist
                    $this.find( '.screen' ).length || $this.append( '<div class="screen"></div>' );
                    ( options.mode === 'slider' ) && ( ! $this.find( '.slider' ).length ) && $this.append( '<div class="slider"></div>' );
                    ( options.mode === 'jumper' ) && ( ! $this.find( '.jumper' ).length ) && $this.append( '<div class="jumper"></div>' );
                    // bind events
                    _bindEvents.call( $this );
                }
                ( options.mode === 'slider' ) && $this.find( '.slider' ).pSlider( options );
                ( options.mode === 'jumper' ) && $this.find( '.jumper' ).pJumper( options );
                $this.find( '.screen' ).pScreen( options );
            });
        },

        destroy: function() {
            return this.each( function() {
                var $this = $( this),
                    $screen = $this.find( '.screen' ),
                    $slider = $this.find( '.slider' ),
                    $jumper = $this.find( '.jumper' );
                // remove namespace
                $this.removeClass( 'pagination' );
                // remove child doms
                $screen.pScreen( 'destroy' );
                $slider.length && $this.find( '.slider' ).pSlider( 'destroy' );
                $jumper.length && $this.find( '.jumper' ).pJumper( 'destroy' );
                $this.empty();
            });
        },

        // set or get the 'render' callback
        // the callback function receives a json data from dataSource and should return a dom
        // you'd better bind events to the parent for better performance
        // eg. $( '#page' ).on( 'click', '.item', function( event ) {} );
        render: function( callback ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'render', callback );
        },

        // set or get the dataSource, it can be a url or a function of 'Mocker'
        // screen will reload after changing dataSource
        // dataSource should handle ajax params like this:
        //    params: {
        //        query: 'type gte {a}, type lte {z}, time gt {0}',
        //        sort: 'type asc, time desc',
        //        skip: 0,
        //        limit: 100,
        //        count: true
        //    }
        // and returns data like this:
        //    data: {
        //        count: 100,
        //        list: [ { foo: 'bar' }, { foo: 'bar' } ]
        //    }
        dataSource: function( dataSource ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'dataSource', dataSource );
        },

        // set or get the 'sort' of dataSource params
        // screen will reload after changing params
        // params eg. 'type asc, time desc' or
        //            [ { key: 'type', order: 'asc' }, { key: 'time', order: 'desc' } ]
        sort: function( sort ) {
            var $screen = $( this ).find( '.screen' ),
                params = $screen.pScreen( 'params' ) || {};
            if ( sort != null ) {
                params.orderBy = _.isString( sort ) ? sort : _sortTransformer( sort );
                $screen.pScreen( 'params', params );
            } else {
                return _sortTransformer( params.sort );
            }
        },

        // set or get the 'query' of dataSource params
        // screen will reload after changing params
        // params eg. 'type lte {orange}, time gt {0}' or
        //            [ { key: 'type', operator: 'lte', value: 'orange' }, { key: 'time', operator: 'gt', value: 0 } ]
        query: function( query ) {
            var $screen = $( this ).find( '.screen' ),
                params = $screen.pScreen( 'params' ) || {};
            if ( query != null ) {
                params.query = _.isString( query ) ? query : _queryTransformer( query );
                $screen.pScreen( 'params', params );
            } else {
                return _queryTransformer( params.query );
            }
        },

        // set or get the dataSource params
        // screen will reload after changing params
        params: function( params ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'params', params );
        },

        // set or get the selections
        // $doms will join selections after 'click' or 'touch' events
        // params eg. [ 0, 1 ] for selecting the first and second
        select: function( selections ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'select', selections );
        },

        // reload pagination with the same dataSource and params
        reload: function() {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'reload' );
        }

    };

    $.fn.pagination = function( method ) {
        if ( methods[ method ] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.pagination' );
        }
    };

    var _bindEvents = function() {
        var that = this,
            $screen = that.find( '.screen'),
            $slider = that.find( '.slider' ),
            $jumper = that.find( '.jumper' );
        $screen.on( 'reload', function( event, args ) {
            // reset slider
            $slider.length && $slider.pSlider( 'attr', {
                start: 0,
                limit: args.pageSize,
                total: args.count,
                silent: true
            });
            $jumper.length && $jumper.pJumper( 'attr', {
                current: 0,
                pageSize: args.pageSize,
                count: args.count,
                silent: true
            });
            event.stopPropagation();
        });
        $slider.length && $slider.on( 'change:start', function( event, start ) {
            // point at the given location
            $screen.pScreen( 'locate', start );
            event.stopPropagation();
        });
        $jumper.length && $jumper.on( 'change:current', function( event, current ) {
            // point at the given location
            $screen.pScreen( 'locate', current );
            event.stopPropagation();
        });
    };

    var _sortTransformer = function( sort ) {
        if ( _.isArray( sort ) ) {
            return _.reduce( _.map( sort , function( current ) {
                return current.key + ' ' + current.order;
            }), function( memo, value ){
                return memo + ',' + value;
            });
        }
        if ( _.isString( sort ) ) {
            return ( sort = sort.replace( /^\s+|\s+$/g, '' ), sort === '' ) ? [] :
                _.map( sort.split( /\s*,\s*/ ), function( current ) {
                    current = current.split( /\s+/ );
                    return {
                        key: current[ 0 ],
                        order: current[ 1 ]
                    };
                });
        }
        return [];
    };

    var _queryTransformer = function( query ) {
        if ( _.isArray( query ) ) {
            return _.reduce( _.map( query , function( current ) {
                return current.key + ' ' + current.operator + ' ' + current.value;
            }), function( memo, value ){
                return memo + ',' + value;
            });
        }
        if ( _.isString( query ) ) {
            return ( query = query.replace( /^\s+|\s+$/g, '' ), query === '' ) ? [] :
                _.map( query.replace( /\s*\}$/g, '' ).split( /\s*\}\s*\,\s*/ ), function( current ) {
                    var divide = current.lastIndexOf('{');
                    var front = current.substring( 0, divide ).replace( /\s+$/, '' ).split( /\s+/ );
                    var behind = current.substring( divide + 1 ).replace( /^\s+/, '' );
                    return {
                        key: front[ 0 ],
                        operator: front[ 1 ],
                        value: behind
                    };
                });
        }
        return [];
    };

    (function(){
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
                    if ( !$data.count && data.count != null ) {
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
                    buffer = $data.buffer,
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
    })();

    (function(){
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
                        var max = Math.max( $data.total - $data.limit, 0 );
                        if ( goal > max ) {
                            // let user reach bottom to the greatest extent
                            goal = Math.min( Math.max( max, $data.start + 1 ), $data.total - 1 );
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
    })();

    (function(){
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
    })();

    (function(){
        var NAME_SPACE    = 'pJumper',
            DEBOUNCE_RATE = 500;         // prevent frequently input

        var _template = [
            '<span class="tip text">',
                '共<span class="count">0</span>条, <span class="pageCount">0</span>页',
            '</span>',
            '<button class="prev text">上一页</button>',
            '<span class="current text">',
                '第<span class="read">0</span><input class="write text">页',
            '</span>',
            '<button class="next text">下一页</button>'
        ].join( '' );

        var methods = {
            init: function( opts ) {
                var options = $.extend( { current:0, count:0 }, opts );
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
                    $this.removeData( NAME_SPACE );
                    // remove child doms
                    $this.empty();
                });
            },

            // key can be 'current', 'pageSize' or 'count'
            attr: function( key, value ) {
                return _attr.apply( $( this ), arguments );
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
                $data = that.data( NAME_SPACE ),
                $prev = that.find( '.prev' ),
                $next = that.find( '.next' ),
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
            var _debounceAttr = _.debounce( _attr, DEBOUNCE_RATE );
            $currentWrite.on( 'blur', function( event ) {
                $currentRead.css( 'display', 'inline' );
                $currentWrite.css( 'display', 'none' );
            }).on( 'keyup', function( event ) {
                var inputVal = $currentWrite.val();
                if ( ! /^\d+$/.test( inputVal ) ) {
                    $currentWrite.val( /^\d+/.exec( inputVal ) );
                    return false;
                } else {
                    _debounceAttr.call( that, 'current', ( inputVal - 1 ) * $data.pageSize );
                }
            }).on( 'keypress', function( event ) {
                // ie8 hacks. preventing $next button trigger in ie8
                if ( event.keyCode === 13 ) return false;
            });
        };

        var _attr = function( key, value ) {
            var $data = this.data( NAME_SPACE );
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
    })();

});