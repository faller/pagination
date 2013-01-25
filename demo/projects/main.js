require.config({
    paths: {
        jquery: 'http://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min',
        underscore: 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min',
        'jquery-mousewheel': 'http://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.0.6/jquery.mousewheel.min',
        plugins: '../../js',
        utils: '../utils'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        'jquery-mousewheel': {
            deps: [ 'jquery' ]
        }
    }
});

require( [ 'jquery', 'underscore', 'utils/mocker', 'plugins/pagination' ], function( $, _, Mocker ) {
    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    var renderCallback = function( item ) {
        var template = _.template( $( '#projectTemplate' ).html().trim(), item );
        return $( template );
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
            key: 'time',
            values: { min: 1325347200000, max: 1356883200000 }
        },{
            key: 'company',
            values: [ '深圳供电局', '广东供电公司', '广西供电公司', '云南供电公司', '海南供电公司', '贵州供电公司' ]
        },{
            key: 'voltage',
            values: [ 110, 220, 500 ]
        },{
            key: 'money',
            values: { min: 1, max: 100000 }
        }],
        onCreate: function( item ) {
            item.time = ( new Date( item.time ) ).toLocaleDateString();
        }
    });

    $( document ).ready( function() {
        $( '#projects' ).pagination({
            dataSource: dataSource,            // can be a url or a function of 'Mocker'
            render: renderCallback,            // renderCallback( item, pageNumber, index ) which returns a dom element
            params: {
                sort: 'type asc, money desc'
            },
            pageSize: 10,
            buffered: true,
            mode: 'jumper'
        });
    });
});