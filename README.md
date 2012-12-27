Pagination
==========

Pagination with data buffering and optional slider style

  ```javascript
    usage eg.
    $( '#page' ).pagination({
          dataSource: 'xxxx.action',         // can be a function or url
          onData: onDataCallback,            // a callback return dom element
          params: {
              query: 'type gte {a}, type lte {z}, time gt {0}',
              sort: 'type asc, time desc'
          },
          pageSize: 10,
          buffered: true,                    // smart enough to pre-read and cache data
          mode: 'slider'                     // try 'slider' in narrow space and 'jumper' in waterfall page
    };
  ```
