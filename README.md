Pagination
==========

Pagination with data buffering and optional slider style

  ```javascript
    usage eg.
    $( '#page' ).pagination({
          dataSource: 'xxxx.action',                            // can be a url or a function of 'Mocker'
          params: {                                             // params here will be passed to dataSource
              query: 'type gte {a}, type lte {z}, time gt {0}',
              sort: 'type asc, time desc'
          },
          method: 'GET',                                        // default: 'GET'
          success: null,                                        // successCallback( data ), default: do nothing
          error: null,                                          // errorCallback(), default: do nothing
          render: renderCallback,                               // renderCallback( item, pageNumber, index ) which returns a dom element
          mode: 'slider',                                       // try 'slider' in narrow space and 'jumper' in waterfall page
          pageSize: 10,
          initPageAmount: 1                                     // default: 1
          buffered: true,                                       // smart enough to pre-read and cache data
          bufferPageAmount: 2,                                  // default: 2
    }
  ```
