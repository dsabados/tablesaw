/*
* tablesaw: A set of plugins for responsive tables
* Sortable column headers
* Copyright (c) 2013 Filament Group, Inc.
* MIT License
*/

;(function() {
	function getSortValue( cell ) {
		var text = [];
		$( cell.childNodes ).each(function() {
			var $el = $( this );
			if( $el.is( 'input, select' ) ) {
				text.push( $el.val() );
			} else if( $el.is( '.tablesaw-cell-label' ) ) {
			} else {
				text.push( ( $el.text() || '' ).replace(/^\s+|\s+$/g, '') );
			}
		});

		return text.join( '' );
	}

	var pluginName = "tablesaw-sortable",
		initSelector = "table[data-" + pluginName + "]",
		sortableSwitchSelector = "[data-" + pluginName + "-switch]",
		attrs = {
			defaultCol: "data-tablesaw-sortable-default-col",
			numericCol: "data-tablesaw-sortable-numeric",
			subRow: "data-tablesaw-subrow"
		},
		classes = {
			head: pluginName + "-head",
			ascend: pluginName + "-ascending",
			descend: pluginName + "-descending",
			switcher: pluginName + "-switch",
			tableToolbar: 'tablesaw-toolbar',
			sortButton: pluginName + "-btn"
		},
		methods = {
			_create: function( o ){
				return $( this ).each(function() {
					var init = $( this ).data( pluginName + "-init" );
					if( init ) {
						return false;
					}
					$( this )
						.data( pluginName + "-init", true )
						.trigger( "beforecreate." + pluginName )
						[ pluginName ]( "_init" , o )
						.trigger( "create." + pluginName );
				});
			},
			_init: function(){
				var el = $( this ),
					heads,
					$switcher;

				var addClassToHeads = function( h ){
						$.each( h , function( i , v ){
							$( v ).addClass( classes.head );
						});
					},
					makeHeadsActionable = function( h , fn ){
						$.each( h , function( i , col ){
							var b = $( "<button class='" + classes.sortButton + "'/>" );
							b.on( "click" , { col: col } , fn );
							$( col ).wrapInner( b ).find( "button" ).append( "<span class='tablesaw-sortable-arrow'>" );
						});
					},
					clearOthers = function( sibs ){
						$.each( sibs , function( i , v ){
							var col = $( v );
							col.removeAttr( attrs.defaultCol );
							col.removeClass( classes.ascend );
							col.removeClass( classes.descend );
						});
					},
					headsOnAction = function( e ){
						if( $( e.target ).is( 'a[href]' ) ) {
							return;
						}

						e.stopPropagation();
						var head = $( this ).parent(),
							v = e.data.col,
							newSortValue = heads.index( head[0] );

						clearOthers( head.siblings() );
						if( head.is( "." + classes.descend ) || !head.is( "." + classes.ascend ) ){
							el[ pluginName ]( "sortBy" , v , true);
							newSortValue += '_asc';
						} else {
							el[ pluginName ]( "sortBy" , v );
							newSortValue += '_desc';
						}
						if( $switcher ) {
							$switcher.find( 'select' ).val( newSortValue ).trigger( 'refresh' );
						}

						e.preventDefault();
					},
					handleDefault = function( heads ){
						$.each( heads , function( idx , el ){
							var $el = $( el );
							if( $el.is( "[" + attrs.defaultCol + "]" ) ){
								if( !$el.is( "." + classes.descend ) ) {
									$el.addClass( classes.ascend );
								}
							}
						});
					},
					addSwitcher = function( heads ){
						$switcher = $( '<div>' ).addClass( classes.switcher ).addClass( classes.tableToolbar );

						var html = [ '<label>' + Tablesaw.i18n.sort + ':' ];

						html.push( '<span class="btn"><select>' );
						heads.each(function( j ) {
							var $t = $( this );
							var isDefaultCol = $t.is( "[" + attrs.defaultCol + "]" );
							var isDescending = $t.is( "." + classes.descend );

							var hasNumericAttribute = $t.is( '[' + attrs.numericCol + ']' );
							var numericCount = 0;
							// Check only the first four rows to see if the column is numbers.
							var numericCountMax = 5;
							$( this.cells.slice( 0, numericCountMax ) ).each(function() {
								if( !isNaN( parseInt( getSortValue( this ), 10 ) ) ) {
									numericCount++;
								}
							});
							var isNumeric = numericCount === numericCountMax;
							if( !hasNumericAttribute ) {
								$t.attr( attrs.numericCol, isNumeric ? "" : "false" );
							}

							html.push( '<option' + ( isDefaultCol && !isDescending ? ' selected' : '' ) + ' value="' + j + '_asc">' + $t.text() + ' ' + ( isNumeric ? '&#x2191;' : '(A-Z)' ) + '</option>' );
							html.push( '<option' + ( isDefaultCol && isDescending ? ' selected' : '' ) + ' value="' + j + '_desc">' + $t.text() + ' ' + ( isNumeric ? '&#x2193;' : '(Z-A)' ) + '</option>' );
						});
						html.push( '</select></span></label>' );

						$switcher.html( html.join('') );

						var $toolbar = el.prev().filter( '.tablesaw-bar' ),
							$firstChild = $toolbar.children().eq( 0 );

						if( $firstChild.length ) {
							$switcher.insertBefore( $firstChild );
						} else {
							$switcher.appendTo( $toolbar );
						}
						$switcher.find( '.btn' ).tablesawbtn();
						$switcher.find( 'select' ).on( 'change', function() {
							var val = $( this ).val().split( '_' ),
								head = heads.eq( val[ 0 ] );

							clearOthers( head.siblings() );
							el[ pluginName ]( 'sortBy', head.get( 0 ), val[ 1 ] === 'asc' );
						});
					};

					el.addClass( pluginName );

					heads = el.children().filter( "thead" ).find( "th[data-" + pluginName + "-col]" );

					addClassToHeads( heads );
					makeHeadsActionable( heads , headsOnAction );
					handleDefault( heads );

					if( el.is( sortableSwitchSelector ) ) {
						addSwitcher( heads );
					}
			},
			sortRows: function( rows, colNum, ascending, col, tbody ){
				function convertCells( cellArr, belongingToTbody ){
					var cells = [];
					$.each( cellArr, function( i , cell ){
						var row = cell.parentNode;
						var subrow = $( row ).next().filter( "[" + attrs.subRow + "]" );

						if( $( row ).is( "[" + attrs.subRow + "]" ) ) {
						} else if( row.parentNode === belongingToTbody ) {
							cells.push({
								element: cell,
								cell: getSortValue( cell ),
								row: row,
								subrow: subrow.length ? subrow[ 0 ] : null
							});
						}
					});
					return cells;
				}

				function getSortFxn( ascending, forceNumeric ){
					var fn,
						regex = /[^\-\+\d\.]/g;
					if( ascending ){
						fn = function( a , b ){
							if( forceNumeric ) {
								return parseFloat( a.cell.replace( regex, '' ) ) - parseFloat( b.cell.replace( regex, '' ) );
							} else {
								return a.cell.toLowerCase() > b.cell.toLowerCase() ? 1 : -1;
							}
						};
					} else {
						fn = function( a , b ){
							if( forceNumeric ) {
								return parseFloat( b.cell.replace( regex, '' ) ) - parseFloat( a.cell.replace( regex, '' ) );
							} else {
								return a.cell.toLowerCase() < b.cell.toLowerCase() ? 1 : -1;
							}
						};
					}
					return fn;
				}

				function convertToRows( sorted ) {
					var newRows = [], i, l;
					for( i = 0, l = sorted.length ; i < l ; i++ ){
						newRows.push( sorted[ i ].row );
						if( sorted[ i ].subrow ) {
							newRows.push( sorted[ i ].subrow );
						}
					}
					return newRows;
				}

				var fn;
				var sorted;
				var cells;

				// TODO get only cells from the tbody
				cells = convertCells( col.cells, tbody );

				var customFn = $( col ).data( 'tablesaw-sort' );

				fn = ( customFn && typeof customFn === "function" ? customFn( ascending ) : false ) ||
					getSortFxn( ascending, $( col ).is( '[' + attrs.numericCol + ']' ) && !$( col ).is( '[' + attrs.numericCol + '="false"]' ) );

				sorted = cells.sort( fn );

				rows = convertToRows( sorted );

				return rows;
			},
			makeColDefault: function( col , a ){
				var c = $( col );
				c.attr( attrs.defaultCol , "true" );
				if( a ){
					c.removeClass( classes.descend );
					c.addClass( classes.ascend );
				} else {
					c.removeClass( classes.ascend );
					c.addClass( classes.descend );
				}
			},
			sortBy: function( col , ascending ){
				var el = $( this );
				var colNum;
				var tbl = el.data( "tablesaw" );
				tbl.$tbody.each(function() {
					var tbody = this;
					var $tbody = $( this );
					var rows = tbl.getBodyRows( tbody );
					var sortedRows;
					var map = tbl.headerMapping[ 0 ];
					var j, k;

					// find the column number that we’re sorting
					for( j = 0, k = map.length; j < k; j++ ) {
						if( map[ j ] === col ) {
							colNum = j;
							break;
						}
					}

					sortedRows = el[ pluginName ]( "sortRows" , rows, colNum, ascending, col, tbody );

					// replace Table rows
					for( j = 0, k = sortedRows.length; j < k; j++ ) {
						$tbody.append( sortedRows[ j ] );
					}
				});

				el[ pluginName ]( "makeColDefault" , col , ascending );

				el.trigger( "tablesaw-sorted" );
			}
		};

	// Collection method.
	$.fn[ pluginName ] = function( arrg ) {
		var args = Array.prototype.slice.call( arguments , 1),
			returnVal;

		// if it's a method
		if( arrg && typeof( arrg ) === "string" ){
			returnVal = $.fn[ pluginName ].prototype[ arrg ].apply( this[0], args );
			return (typeof returnVal !== "undefined")? returnVal:$(this);
		}
		// check init
		if( !$( this ).data( pluginName + "-active" ) ){
			$( this ).data( pluginName + "-active", true );
			$.fn[ pluginName ].prototype._create.call( this , arrg );
		}
		return $(this);
	};
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods );

	$( document ).on( Tablesaw.events.create, function( e, Tablesaw ) {
		if( Tablesaw.$table.is( initSelector ) ) {
			Tablesaw.$table[ pluginName ]();
		}
	});

}());
