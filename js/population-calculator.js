$(document).ready(function() {

	// population calculator
	$('form#population-form').each(function(){
		var form = $(this),
			form_saveTimer = null,
			fieldsets = [
				form.find('#residences-fieldset'),
				form.find('#inhabitants-fieldset'),
				form.find('#demands-fieldset'),
				form.find('#production-fieldset')
			]
			display_options_buttons = $('#display-options').find('li a'),
			residence_capacity = [ [ 8, 15, 25, 40 ], [ 5, 30 ] ],
			cc_target = form.find('#commodity-chain-target'),
			selected_items = [],
			inhabitants = {},
			demands = {};

		
		// show / hide fieldsets
		display_options_buttons.each(function(i){
			$(this).click(function(ev){
				ev.preventDefault();
				fieldsets[i].fadeToggle();
				$(this).toggleClass('active');
				$('#hidden-fieldset input:eq('+i+')').val( $(this).hasClass('active') ? '1' : '0' );
				if( i==3 && !$(this).hasClass('active') )
					fieldsets[i].find('li').each(function(){
						$(this).trigger('deselectItem')
					}).end().trigger('updateSelection');
				form.trigger('save');
			});
			if( !$(this).hasClass('active') ) {
				fieldsets[i].fadeOut(0);
				$('#hidden-fieldset input:eq('+i+')').val('0');
			}
		});
		form.find('a.display-hide').each(function(i){
			$(this).click(function(ev){
				ev.preventDefault();
				$(display_options_buttons[i]).trigger('click');
			});
		})
		
		// reset buttons
		form.find('input.reset').each(function(){
			$(this).bind({
				click: function() {
					form.trigger('setDefaults');
				}
			});
		});
		
		// bind form events
		form.bind({

			// form submission
			submit: function(ev) {
				ev.preventDefault();
				$(this).trigger('calc');
			},
			
			// set default values
			setDefaults: function() {
				fieldsets[3].find('li').each(function(){
					$(this).find('.productivity').find('input').val('100');
				});
				fieldsets[0].find('dl').each(function(i){
					$(this).find('dd').filter(':first').find('.slider').slider( 'value', (i<3?4:2) ).end().end().find('input[type=text]').val('0');
					$(this).find('dd.info_channel').each(function() {
						$(this).find('a').removeClass('active');
						$(this).find('input').val('0');
					});
					if( i==2 )
						$(this).find('dd:first input[type=text]:first').trigger('change');
				});

			},
			
			// calc
			calc: function() {
				$(this).trigger('setInhabitants').trigger('calcDemands');
			},
			
			// set inhabitants
			setInhabitants: function() {
				inhabitants = {};
				fieldsets[1].find('dl').each(function(){
					$(this).find('input[type=text]').not(':last').each(function(){
						var n = $(this).attr('name')
						inhabitants[n.substr(0,n.length-1)] = filterNum($(this).val());
					})
				})
			},
			
			// calculate demands
			calcDemands: function() {
				demands = {};
				var decreasedDemandForLifestyle = form.find('input[name=ecos_info]').val()=='2' ? true : false;
				for( var product_guid in all_demands ) {
					demands[product_guid] = 0;
					var multiplier = decreasedDemandForLifestyle && $.inArray(product_guid,['2500029','2500030','2500031'])!=-1 ? 0.85 : 1;
					for( var population in all_demands[product_guid] )
						demands[product_guid] += inhabitants[population]/100 * ( all_demands[product_guid][population]/1000 * multiplier );
				}
				fieldsets[2].trigger('update');
				fieldsets[3].trigger('update').trigger('updateSelection');
			},
			
			save: function() {
				clearTimeout(form_saveTimer);
				form_saveTimer = window.setTimeout(function(){
					request({
						url: form.attr('action'),
						data: form.serialize(),
						beforeSend: function(){
						},
						complete: function(){
						}
					});
				},2000);
			}

		});

		// parse fieldsets
		$.each( fieldsets, function(i){
		
			// summarize handler for residence fieldset and inhabitants fieldset
			if( i<=1 )
				$(this).bind({
					summarize: function(){
						$(this).find('dl').each(function(){
							var group = getGroup( this );
								valTotal = 0;
							for( var i=1; i<=( group=='techs' ? 2 : 4 ); i++ )
								valTotal += filterNum( $(this).find('dd.'+group+(i)+' input:first').val() );
							$(this).find('dd.'+group+'0 input[type=text]').val( valTotal );
						});
						if( i==1 )
							form.trigger('calc');
					}
				});
			
			// residence fieldset
			if( i==0 ) {
			
				// for each party
				$(this).find('dl').each(function(){
				
					// upgrade permission slider
					$(this).find('.slider').each(function(){
						var tabindex = $(this).attr('data-tabindex');
						$(this).slider({
							value: filterNum($(this).next().val()),
							range: 'min',
							min: 1,
							max: $(this).closest('dl').hasClass('techs') ? 2 : 4,
							step: 1,
							slide: function( ev, ui ) {
								var dl = $(this).closest('dl'),
									group = getGroup( dl );
								$(this).next().val( ui.value );
								dl.find('dt,dd').removeClass('locked');
								for( var i=( group=='techs' ? 2 : 4 ); i>ui.value; i-- )
									dl.find('dd.'+group+i+':first,dt.'+group+i+':first').addClass('locked');
								$(this).prev().trigger('change');
							}
						}).find('.ui-slider-handle').bind({
							focus: function(){
								var dl = $(this).closest('dl'),
									group = getGroup( dl );
								for( var i=( group=='techs' ? 2 : 4 ); i>filterNum($(this).parent().next().val()); i-- )
									dl.find('dd.'+group+i+',dt.'+group+i).addClass('locked');
							},
							blur: function(){
								$(this).closest('dl').find('dt,dd').removeClass('locked');
							}
						}).attr('tabindex',tabindex);
					});
					
					// residence input fields
					$(this).find('dd input[type=text]').filter(':first').each(function(){
						$(this).bind({
							change: function() {
								var dl = $(this).closest('dl'),
									group = getGroup( dl ),
									valTotal = filterNum( $(this).val() ),
									valUpgrade = filterNum( $(this).next().next().val() ),
									vals = [valTotal,0,0,0];
								for( var l=1; l<valUpgrade; l++ ) {
									vals[l] = Math.floor( vals[l-1] * ( 0.2 * ((group=='techs'?4:5)-l) ) );
									vals[l] = vals[l-1]<=vals[l] ? 0 : vals[l];
									vals[l-1] -= vals[l];
								}
								for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
									dl.find('dd.'+group+(i+1)+' input').val( vals[i] );
								fieldsets[1].trigger('updateByResidences');
							}
						});
					}).end().each(function(){
						$(this).bind({
							keydown: function() {
								var val = $(this).val();
								$(this).attr( 'data-value', val==''?'-1':val );
							},
							keyup: function() {
								var val = $(this).val().replace(/[^0-9]/g,'');
								val = val!='' ? parseInt(val,10) : '';
								if( $(this).val()!=val.toString() )
									$(this).val(val);
								if( filterNum($(this).attr('data-value'))!=filterNum($(this).val()) )
									$(this).trigger('change');
							},
							blur: function() {
								$(this).val( filterNum($(this).val()) ).trigger('change');
							}
						});
					}).not(':first').each(function(){
						$(this).bind({
							change: function() {
								fieldsets[0].trigger('summarize');
								fieldsets[1].trigger('updateByResidences');
							}
						});
					});

					// information channels
					$(this).find('dd.info_channel a').each(function(){
						$(this).click(function(ev){
							ev.preventDefault();
							$(this).toggleClass('active');
							$(this).parent().find('input').val( $(this).hasClass('active') ? $(this).attr('data-value') : '0' ).end().find('a').not(this).removeClass('active');
							fieldsets[1].trigger('updateByResidences');
						});
					});

				});
				
			}
			
			// inhabitants fieldset
			else if( i==1 ) {
			
				// update by residences
				$(this).bind({
					updateByResidences: function() {
						inhabitants = {};
						fieldsets[0].find('dl').each(function(){
							var group = getGroup( this ),
								capacity = residence_capacity[ group=='techs' ? 1 : 0 ],
								more_space = $(this).find('dd.'+group+'_info input:first').val()=='1' ? 1.12 : 1;
							inhabitants[group] = [];
							for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
								inhabitants[group][i] = Math.floor( filterNum( $(this).find('dd.'+group+(i+1)+' input').val() )*capacity[i]*more_space );
						});
						$(this).find('dl').each(function(){
							var group = getGroup( this );
							for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
								 $(this).find('dd.'+group+(i+1)+' input:first').val( inhabitants[group][i] )
						});
						$(this).trigger('summarize');
					}
				});
				
				// inhabitants input fields
				$(this).find('dd input[type=text]').not(':last').each(function(){
					$(this).bind({
						change: function() {
							fieldsets[1].trigger('summarize');
						},
						keydown: function() {
							var val = $(this).val();
							$(this).attr( 'data-value', val==''?'-1':val );
						},
						keyup: function() {
							var val = $(this).val().replace(/[^0-9]/g,'');
							val = val!='' ? parseInt(val,10) : '';
							if( $(this).val()!=val.toString() )
								$(this).val(val);
							if( filterNum($(this).attr('data-value'))!=filterNum($(this).val()) )
								$(this).trigger('change');
						},
						blur: function() {
							$(this).val( filterNum($(this).val()) ).trigger('change');
						}
					});
				});

			}
			
			// demands fieldset
			else if( i==2 ) {

				// update values
				$(this).bind({
					update: function() {
						$(this).find('li').each(function(){
							var txt = Math.round( demands[parseInt($(this).attr('data-guid'))] * 10 ) / 10;
							if( lang=='de' )
								txt = txt.toString().replace(/\./,',');
							$(this).find('.count').text( txt );
							if( txt=='0' )
								$(this).addClass('no-demand');
							else
								$(this).removeClass('no-demand');
						});
					}
				});

			}
			
			// production fieldset
			else if( i == 3 ) {

				var fs = $(this),
					lis = $(this).find('li');

				$(this).bind({
				
					// update values
					update: function() {
						lis.each(function(){
							var product_guid = parseInt($(this).attr('data-product-guid')),
								productivity = filterNum( $(this).find('input').val() ) / 100,
								tpm = productions_by_product[product_guid].tpm * productivity,
								count = Math.ceil( demands[product_guid] / tpm ),
								efficiency = demands[product_guid] / ( Math.max(1,count) * tpm ),
								percent = Math.round(efficiency*100);
							// console.debug( $(this).find('.icon-32 span').attr('title'), tpm, demands[product_guid], count, efficiency );
							$(this).find('.count span').text( count );
							$(this).find('.efficiency').text( percent + '%' ).attr( 'class', 'efficiency '+getEfficiencyClass(percent) );
							if( count>0 )
								$(this).removeClass('no-demand');
							else
								$(this).addClass('no-demand').removeClass('selected');
						});
						form.trigger('save');
					},
					
					// update selection
					updateSelection: function() {
						var selected = lis.filter('.selected');
							selected_guids = [];
						selected.each(function(){
							selected_guids.push( $(this).attr('data-guid') );
						});
						if( selected_items != selected_guids ) {
							selected_items = selected_guids;
							if( selected.length==1 ) {
								selected.each(function(){
									var production_guid = $(this).attr('data-guid'),
										product_guid = $(this).attr('data-product-guid'),
										count = filterNum( $(this).find('.count span').text() ),
										productivity = filterNum( $(this).find('.productivity input').val() ),
										container = $('#commodity-chain-container'),
										cc_target_value = cc_target.find('select').val();
									if( production_guid!=container.attr('data-guid') || productivity!=container.attr('data-productivity') || count!=filterNum(container.attr('data-count')) || cc_target_value!=container.attr('data-target') ) {
										container.attr({
											'data-guid': production_guid,
											'data-productivity': productivity,
											'data-count': count,
											'data-target': cc_target_value
										});
										request({
											url: 'get-commoditychain'+(lang!='de'?'/'+lang:''),
											data: 'pb_guid='+production_guid+'&'+ ( cc_target_value=='0' ? 'tpm_needed='+demands[product_guid] : 'count='+count ) +'&productivity['+production_guid+']='+productivity,
											success: function(data) {
												var c = $(data.html);
												processCommodityChain(c);
												cc_target.fadeIn(400);
												if( container.find('div.commodity-chain').length>0 )
													container.find('div.commodity-chain').replaceWith(c);
												else
													c.hide().appendTo( container ).fadeIn(400);
												setProductivityEvents(c.find('span.productivity'));
											}
										});
									}
								});
							}
							else {
								if( $('div.commodity-chain').length>0 ) {
									cc_target.fadeOut(400);
									$('div.commodity-chain').fadeOut(400,function(){
										$('#commodity-chain-container').attr({
											'data-guid': 0,
											'data-productivity': 0,
											'data-count': 0
										});
										$(this).remove()
									});
								}
							}
						}
					}
				});

				// for each item
				lis.each(function(){
					
					var li = $(this),
						p = li.find('.productivity'),
						i = p.find('input'),
						s = p.find('.slider');

					li.bind({

						// activate productivity slider
						activate: function() {
							if( !li.hasClass('no-demand') ) {
								li.addClass('active').trigger('selectItem');
								lis.not(li).trigger('deactivate').trigger('deselectItem');
								fs.trigger('updateSelection');
							}
						},
						
						// deactivate productivity slider
						deactivate: function() {
							li.removeClass('active');
						},
						
						// select item
						selectItem: function() {
							if( !li.hasClass('no-demand') )
								li.addClass('selected');
						},
						
						// deselect item
						deselectItem: function() {
							li.removeClass('selected').trigger('deactivate');
						},
						
						// click item
						click: function(ev) {
							if( !li.hasClass('no-demand') ) {
								if( lis.filter('.selected').length<=1 && li.hasClass('selected') )
									li.trigger('deselectItem');
								else
									li.trigger('selectItem');
								if( !( ev.altKey || ev.shiftKey || ev.ctrlKey ) )
									lis.not(li).trigger('deselectItem');
								fs.trigger('updateSelection');
							}
						}
					});

					// input field events
					i.bind({
						change: function() {
							var v = Math.max(1,Math.min(999,filterNum($(this).val())))
							$(this).val( v );
							s.slider('value',v);
							fs.trigger('update');
						},
						keydown: function() {
							$(this).attr('data-value',$(this).val());
						},
						keyup: function() {
							if( $(this).val()!='' && $(this).attr('data-value')!=$(this).val() )
								$(this).trigger('change');
						},
						blur: function() {
							selected_items = [];
							fs.trigger('updateSelection');
						}
					});

					// window event to hide productivity slider
					$(window).click(function(ev){
						if( li.hasClass('active') && p.find(':focus').length<1 ) {
							li.trigger('deactivate');
						}
					});
					
					// productivity events
					p.bind({
						click: function(ev) {
							i.focus();
							ev.stopPropagation();
						},
						focusin: function(ev) {
							li.trigger('activate');
						}
					});

					// productivity slider
					s.slider({
						value: filterNum(i.val()),
						range: 'min',
						min: 50,
						max: 300,
						step: 1,
						start: function() {
							li.trigger('activate');
						},
						stop: function() {
							selected_items = [];
							fs.trigger('updateSelection');
						},
						slide: function(ev,ui) {
							i.val(ui.value);
							fs.trigger('update');
						}
					});

				});
			}
		});
		
		// commodity chain target tpm
		cc_target.find('select').each(function(){
			$(this).selectmenu('option','select',function(){
				selected_items = [];
				fieldsets[3].trigger('updateSelection');
				form.trigger('save');
			});
		});

		// initialization calculation
		form.trigger('calc');
		
		// console.debug(all_demands);

	});

});
