require.config({
    paths: {
        jquery: 'http://cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min',
        underscore: 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min',
        bootstrap: 'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/js/bootstrap.min',
        'jquery.mousewheel': 'http://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.0.6/jquery.mousewheel.min',
        lib: '../../js'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        bootstrap: {
            deps: [ 'jquery' ]
        },
        'jquery.mousewheel': {
            deps: [ 'jquery' ]
        }
    }
});

require( [ 'jquery', 'underscore', 'lib/mocker', 'lib/pagination' ], function( $, _, Mocker ) {
    _.templateSettings = {
        interpolate : /\{\{=(.+?)\}\}/g
    };

    var onDataCallback = function( data ) {
        var template = _.template( $( '#projectTemplate' ).html(), data );
        return $(template);
    };

    var dataSource = Mocker.mock({
        amount: 100,
        idAttribute: { key: 'id', prefix: 'SCR' },
        randomAttributes: [{
            key: 'name',
            values: [ 'xx输变电工程', 'xx变电站工程' ]
        },{
            key: 'type',
            values: [ '小型变更', '一般变更', '重大变更' ]
        },{
            key: 'reason',
            values: [ '设计错误', '设计漏项', '专业配合', '材料变化', '设计改进', '材料代用', '其他' ]
        },{
            key: 'month',
            values: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ,10, 11, 12 ]
        },{
            key: 'company',
            values: [ '深圳供电局', '广东供电公司', '广西供电公司', '云南供电公司', '海南供电公司', '贵州供电公司' ]
        },{
            key: 'voltage',
            values: [ 110, 220, 500 ]
        },{
            key: 'money',
            values: [ 1012121, 15415001, 545454151, 545451, 893141, 5487911, 348976168, 49841196, 9781154, 487871, 8754518 ]
        }],
        rate: 1000
    });

    $( document ).ready( function() {
        $( '#projects' ).pagination({
            dataSource: dataSource,            // can be a function or url
            onData: onDataCallback,            // a callback return dom element
            params: {
                sort: 'type asc, money desc'
            },
            pageSize: 10,
            buffered: true,
            mode: 'jumper'
        });
    });
});