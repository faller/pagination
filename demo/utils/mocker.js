//    dataSource mocker v0.4.1
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.
//    Mocking dataSource by javascript, providing save, remove, query and sort

//    create eg.
//    var fruitsDataSource = Mocker.mock({
//        template: { say: 'hello' },                             // or an array: [ {..}, {..} ]
//        amount: 100,                                            // it's necessary if template isn't an array
//        idAttribute: 'id',                                      // or json full format: { key: 'id', prefix: 'fruit_' }
//        randomAttributes: [{
//            key: 'type',
//            values: [ 'apple', 'banana', 'orange', 'grapes' ]
//        },{
//            key: 'taste',
//            values: [ 'awesome', 'good', 'shit smells' ]
//        },{
//            key: 'time',
//            values: { min: 1325347200000, max: 1356883200000 }
//        }],
//        onCreate: function( item ) {                            // item on create callback
//            item.say = 'hi';
//        },
//        delay: 1000                                             // simulate request & response delay
//    });

//    or with AMD.
//    require( [ 'mocker' ], function( Mocker ) { } );

//    query eg.
//    fruitsDataSource({
//        params: {
//            query: 'type gte {a}, type lte {z}, time gt {0}',   // or json format: [ { key: 'type', operator: 'like', value: 'apple' } ]
//            sort: 'type asc, time desc',                        // or json format: [ { key: 'time', order: 'desc' } ]
//            skip: 0,
//            limit: 100,
//            count: true
//        },
//        success: function( data ) {
//            console.log( 'data count: ' + data.count );
//            console.log( 'data list: ' );
//            console.log( data.list );
//        },
//        error: function() {
//            console.error( 'shit happens!' );
//        }
//    });

//    save eg.
//    fruitsDataSource({
//        params: {
//            save: {                                             // or string format: "{ 'type': 'orange', 'taste': 'bad' }"
//                type: 'apple',
//                taste: 'awesome',
//                time: new Date().getTime()
//            }
//        },
//        success: function( data ) {
//            console.log( 'data id: ' + data.id );
//        }
//    });

//    remove eg.
//    fruitsDataSource({
//        params: {
//            remove: 'taste eq {shit smells}'                    // or json format: [ { key: 'taste', operator: 'nq', value: 'awesome' } ]
//        },
//        success: function( count ) {
//            console.log( 'data count of remove: ' + count );
//        }
//    });

(function( root, factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [ 'underscore' ], factory );
    } else {
        // Browser globals
        root.Mocker = factory( root._ );
    }
})( this, function( _ ) {

    var generateItems = function( configs ) {
        var items = _.isArray( configs.template ) ? configs.template : _.times( configs.amount, function() {
            return deepClone( configs.template );
        });
        _.each( items, function( item ) {
            if ( configs.idAttribute ) {
                item[ configs.idAttribute.key || configs.idAttribute ] = _.uniqueId( configs.idAttribute.prefix );
            }
            _.each( configs.randomAttributes, function( randomAttribute ) {
                if ( _.isArray( randomAttribute.values ) ) {
                    item[ randomAttribute.key ] = randomAttribute.values[ random( 0, randomAttribute.values.length - 1 ) ];
                } else if ( _.isObject( randomAttribute.values ) ) {
                    item[ randomAttribute.key ] = random( randomAttribute.values.min, randomAttribute.values.max );
                }
            });
            _.isFunction( configs.onCreate ) && configs.onCreate( item );
        });
        // to shuffle items order
        return _.isArray( configs.template ) ? items : _.shuffle( items );
    };

    var saveItem = function( items, item, configs ) {
        if ( configs.idAttribute && item[ configs.idAttribute.key ] != null ) {
            // update
            return _.extend( _.find( items, function( current ) {
                return current[ configs.idAttribute.key ] === item[ configs.idAttribute.key ];
            }), item );
        } else {
            // insert
            configs.idAttribute && ( item[ configs.idAttribute.key ] = _.uniqueId( configs.idAttribute.prefix ) );
            items.unshift( deepClone( item ) );
            return item;
        }
    };

    var queryItems = function( items, queries, onMatch ) {
        var result = _.filter( items, function( item ) {
            return _.every( queries, function( query ){
                switch ( query.operator ) {
                    case 'lt' : return ( item[ query.key ] <  query.value ) ? true : false;
                    case 'lte': return ( item[ query.key ] <= query.value ) ? true : false;
                    case 'eq' : return ( item[ query.key ] == query.value ) ? true : false;
                    case 'ne' : return ( item[ query.key ] != query.value ) ? true : false;
                    case 'gt' : return ( item[ query.key ] >  query.value ) ? true : false;
                    case 'gte': return ( item[ query.key ] >= query.value ) ? true : false;
                    case 'like' : return ( item[ query.key ].indexOf( query.value ) > -1 ) ? true : false;
                    default: console && console.error && console.error( 'unsupport operator: ' + query.operator ); return false;
                }
            });
        });
        _.isFunction( onMatch ) && _.each( result, onMatch );
        return deepClone( result );
    };

    var removeItems = function( items, query ) {
        return queryItems( items, query, function( item, index, _items ) {
            delete items[ index ];
        }).length;
    };

    var sortItems = function( items, sort ) {
        // add next reference for chaining
        for ( var i = 0, length = sort.length; i < length - 1 ; i++ ) {
            sort[ i ].next = sort[ i + 1 ];
        }

        if ( sort.length ) return ( function doSort( currentArray, currentOrder ) {
            // separate by group
            var groups = _.groupBy( currentArray, function( a ) {
                return a[ currentOrder.key ];
            });

            // sort elements of groups by recursion
            if ( currentOrder.next ) {
                var self = arguments.callee;
                _.each( groups, function( group, key ) {
                    groups[ key ] = self( group, currentOrder.next );
                });
            }

            // sort the keys of groups
            var keys = _.keys( groups ).sort( function( a, b ) {
                ( /^[-+]?[0-9]+(\.[0-9]+)?$/.test( a + b) ) && ( a = parseFloat( a ), b = parseFloat( b ) );
                var direction = ( currentOrder.order === 'asc' ) ? 1 : -1;
                var result = ( a > b ) ? 1 : -1;
                return direction * result;
            });

            // link up the groups
            var sortedArray = [];
            _.each( keys, function( key ) {
                sortedArray = sortedArray.concat( groups[ key ] );
            });
            return sortedArray;
        })( items, sort[ 0 ] );
    };

    var parseQuery = function( query ) {
        return ( query == null || ( query = query.replace( /^\s+|\s+$/g, '' ), query === '' ) ) ? [] :
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
    };

    var parseSort = function( sort ) {
        return ( sort == null || ( sort = sort.replace( /^\s+|\s+$/g, '' ), sort === '' ) ) ? [] :
            _.map( sort.split( /\s*,\s*/ ), function( current ) {
                current = current.split( /\s+/ );
                return {
                    key: current[ 0 ],
                    order: current[ 1 ]
                };
            });
    };

    // underscore has bug, use it instead
    var random = function( min, max ) {
        if ( min == null && max == null ) {
            max = 1;
        }
        min = +min || 0;
        if ( max == null ) {
            max = min;
            min = 0;
        }
        return min + Math.floor( Math.random() * ( ( +max || 0 ) - min + 1) );
    };

    var deepClone = function( obj ) {
        if ( _.isArray( obj ) ) {
            var out = [];
            var i = obj.length;
            while( i-- ) {
                out.unshift( arguments.callee( obj[ i ] ) );
            }
            return out;
        }
        if ( _.isObject( obj ) ) {
            var out = {};
            for ( var p in obj ) {
                out[ p ] = arguments.callee( obj[ p ] );
            }
            return out;
        }
        return obj;
    };

    return {
        mock: function( cfgs ) {
            var configs = _.extend( { template: {}, delay: 1000 }, cfgs );
            var items = generateItems( configs );
            return function dataSource( args ) {
                setTimeout( function() {
                    var result;
                    if ( args.params && args.params.save ) {
                        var item = _.isObject( args.params.save ) ? args.params.save : eval( '(' + args.params.save + ')' );
                        result = saveItem( items, item, configs );
                    } else if ( args.params && args.params.remove ) {
                        var query = _.isArray( args.params.remove ) ? args.params.remove : parseQuery( args.params.remove );
                        result = removeItems( items, query );
                    } else {
                        var params = _.extend( { skip: 0, limit: 1000000 }, args.params );
                        var query = _.isArray( params.query ) ? params.query : parseQuery( params.query );
                        var matchedItems = queryItems( items, query );
                        if ( params.sort ) {
                            var sort = _.isArray( params.sort ) ? params.sort : parseSort( params.sort );
                            matchedItems = sortItems( matchedItems, sort );
                        }
                        result = {
                            count: ( params.count === true ) ? matchedItems.length : null,
                            list: matchedItems.slice( params.skip, params.skip + Math.min( params.limit, matchedItems.length - params.skip ) )
                        };
                    }
                    _.isFunction( args.success ) && args.success( result );
                }, configs.delay );
            };
        }
    };
});