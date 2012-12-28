//    pagination v0.4, require screen.js & ( slider.js or jumper.js )
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
//          onData: onDataCallback,                               // a callback returns dom element
//          mode: 'slider',                                       // try 'slider' in narrow space and 'jumper' in waterfall page
//          pageSize: 10,
//          initPageAmount: 1                                     // default: 1
//          buffered: true,                                       // smart enough to pre-read and cache data
//          bufferPageAmount: 2,                                  // default: 2
//    }

(function ( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'underscore', './screen', './slider', './jumper' ], factory );
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

        // set or get the 'onData' callback
        // the callback function receives a json data from dataSource and should return a dom
        // you'd better bind events to the parent for better performance
        // eg. $( '#page' ).on( 'click', '.item', function( event ) {} );
        onData: function( callback ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'onData', callback );
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
            if ( sort ) {
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
            if ( query ) {
                params.orderBy = _.isString( query ) ? query : _queryTransformer( query );
                $screen.pScreen( 'params', params );
            } else {
                return _queryTransformer( params.query );
            }
        },

        // set or get the selections
        // $doms will join selections after 'click' or 'touch' events
        // params eg. [ 0, 1 ] for selecting the first and second
        select: function( selections ) {
            var $screen = $( this ).find( '.screen' );
            return $screen.pScreen( 'select', selections );
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

});