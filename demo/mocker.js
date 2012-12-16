//    dataSource mocker v0.3
//    (c) 2012-2013 caicanliang, faller@faller.cn
//    freely distributed under the MIT license.
//    use for mocking ajax request & response
//
//    usage eg.
//    var fruitsDataSource = mock({
//        template: { fact: 'suck' },
//        amount: 100,
//        idAttribute: 'id',
//        timeAttribute: 'time',
//        randomAttributes: [{
//            key: 'type',
//            values: [ 'apple', 'banana', 'orange', 'grapes' ]
//        },{
//            key: 'taste',
//            values: [ 'awesome', 'good', 'shit smells' ]
//        }],
//        rate: 1000
//    });
//
//    fruitsDataSource({
//        params: {
//            query: 'type gte a, type lte z, time gt 0',
//            sort: 'type asc, time desc',
//            skip: 0,
//            limit: 100,
//            count: true
//        },
//        success: function( data ) {
//            console.log( 'data count:' + data.count );
//            console.log( 'data list:' );
//            console.log( data.list );
//        },
//        error: function() {
//            console.error( 'shit happens!' );
//        }
//    });

(function( undefined ) {
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
    root.mock = function( opts ) {
        var options = _.extend( { template: {}, rate: 1000 }, opts );
        var items = (function() {
            var timeSeed = new Date().getTime();
            var items = [];
            var i = options.amount;
            while ( i-- ) {
                var item = deepCopy( options.template );  // deep clone
                options.idAttribute && ( item[ options.idAttribute ] = i );
                options.timeAttribute && ( item[ options.timeAttribute ] = timeSeed - 1000 * i );
                _.each( options.randomAttributes, function( randomAttribute ) {
                    item[ randomAttribute.key ] = randomAttribute.values[ _.random( 0, randomAttribute.values.length - 1 ) ];
                });
                items.unshift( item );
            }
            // to shuffle items order
            return _.shuffle( items );
        })();

        return function dataSource( args ){
            var params = _.extend( { skip:0, limit:1000000 }, args.params );

            var toReturn = {
                count: null,
                list: []
            };

            setTimeout( function() {
                if ( params.query ) {
                    var query = _.isArray( params.query ) ? params.query :
                        _.map( params.query.split( ',' ), function( current ) {
                            current = trim( current ).split( ' ' );
                            return {
                                key: trim( current[ 0 ] ),
                                operator: trim( current[ 1 ] ),
                                value: trim( current[ 2 ] )
                            };
                        });

                    var i = items.length;
                    while ( i-- ) {
                        var currentData = items[ i ];
                        var j = query.length;
                        if ( j === 0 ) {
                            toReturn.list.unshift( currentData );
                        } else {
                            while ( j-- ) {
                                var currentQuery = query[ j ];
                                var isMatch = false;
                                switch ( currentQuery.operator ) {
                                    case 'lt' : if ( currentData[ currentQuery.key ] <  currentQuery.value ) isMatch = true; break;
                                    case 'lte': if ( currentData[ currentQuery.key ] <= currentQuery.value ) isMatch = true; break;
                                    case 'eq' : if ( currentData[ currentQuery.key ] == currentQuery.value ) isMatch = true; break;
                                    case 'ne' : if ( currentData[ currentQuery.key ] != currentQuery.value ) isMatch = true; break;
                                    case 'gt' : if ( currentData[ currentQuery.key ] >  currentQuery.value ) isMatch = true; break;
                                    case 'gte': if ( currentData[ currentQuery.key ] >= currentQuery.value ) isMatch = true; break;
                                    case 'like' : if ( currentData[ currentQuery.key ].indexOf( currentQuery.value ) > -1 ) isMatch = true; break;
                                    default: console.error( 'unsupport operator: ' + currentQuery.operator );
                                }
                                if ( !isMatch ) {
                                    break;
                                } else if ( j === 0 ) {
                                    toReturn.list.unshift( currentData );
                                }
                            }
                        }
                    }
                } else {
                    toReturn.list = items.concat();
                }

                if ( params.sort ) {
                    var sort = _.isArray( params.sort ) ? params.sort :
                        _.map( params.sort.split( ',' ), function( current ) {
                            current = trim( current ).split( ' ' );
                            return {
                                key: trim( current[ 0 ] ),
                                order: trim( current[ 1 ] )
                            };
                        });

                    // add next reference for chaining
                    for ( var i = 0, length = sort.length; i < length - 1 ; i++ ) {
                        sort[ i ].next = sort[ i + 1 ];
                    }

                    if ( sort.length )
                        toReturn.list = doSort( toReturn.list, sort[ 0 ] );

                    function doSort( currentArray, currentOrder ) {
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
                    }
                }

                if ( params.count === true ) {
                    toReturn.count = toReturn.list.length;
                }

                toReturn.list = toReturn.list.slice( params.skip, params.skip + Math.min( params.limit, toReturn.list.length - params.skip ) );

                args.success( toReturn );
            }, options.rate );

        };
    };

    var trim = (function() {
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        return function( text ) {
            return text == null ? '' : ( text + '' ).replace( rtrim, '' );
        };
    })();

    var deepCopy = function( obj ) {
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

})();

// yeah, mocker is not a mother fucker