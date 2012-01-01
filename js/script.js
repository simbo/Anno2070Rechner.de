
var baseurl, lang;

function request( _options ) {
	var options = $.extend({
		url: '',
		type: 'post',
		dataType: 'json',
		error: function(xhr,txt,err) {
			alert( 'AJAX Error: '+txt+' ('+err+')' );
		}
	}, _options);
	options.url = baseurl+options.url;
	options.data = options.data+'&ajax=1';
	return $.ajax(options);
}

function processCommodityChain( c ) {
	$(c).each(function(){
		var chain_container = $(this),
			chains = chain_container.find('dl.chain');
		chains.each(function(i){
			$(this).find('.production').each(function(){
				$(this).click(function(){
					if( $(this).closest('dd').hasClass('alt') ) {
						var dl = $(this).closest('dl');
							dt = dl.find('dt:first');
						$(this).closest('dd').detach().removeClass('alt').insertAfter(dt);
						dl.find('.production').not(this).closest('dd').addClass('alt');
						chain_container.trigger('summarize');
					}
				})
			}).end().find('dd').not(':first').addClass('alt');
		});
		$(this).bind({
			summarize: function(){
				var container = $(this).find('.summary');
				if( container.length<1 )
					container = $('<div class="summary"></div>').prependTo(this);
				var mc = {
						credits: [ 0, 0, '' ],
						energy: [ 0, 0, '' ],
						eco: [ 0, 0, '' ]
					},
					bc_credits = [ 0, '' ],
					bc_products = {},
					productions = {};
				$(this).find('dl').find('.production:first').each(function(){
					var p_guid = $(this).attr('data-guid');
					if( productions[p_guid]==undefined )
						productions[p_guid] = [ filterNum($(this).find('.count').text().substr(1)), $(this).attr('data-icon'), $(this).find('.name').text() ];
					else
						productions[p_guid][0] += filterNum($(this).find('.count').text().substr(1));
					$(this).find('.build-costs li').each(function(){
						var n =  filterNum( $.trim( $(this).text() ) );
						if( $(this).attr('class')=='credits' ) {
							bc_credits[0] += n;
							bc_credits[1] = $(this).attr('title');
						}
						else {
							var bcp_guid = $(this).attr('data-guid');
							if( bc_products[bcp_guid]==undefined )
								bc_products[bcp_guid] = [ n, $(this).css('background-image'), $(this).attr('title') ];
							else
								bc_products[bcp_guid][0] += n;
						}	
					}).end().find('.maintenance-costs li').each(function(){
						var txt =  $(this).text().split('/');
						mc[ $(this).attr('class') ][0] += filterNum($.trim(txt[0]));
						mc[ $(this).attr('class') ][1] += filterNum($.trim(txt[1]));
						mc[ $(this).attr('class') ][2] = $(this).attr('title');
					});
				})
				var html = '<dl class="productions">';
				$.each( productions, function(){
					html += '<dt>&times;'+this[0]+'</dt><dd><span class="icon-16"><span style="background-image:url(\'img/icons/16/'+this[1]+'\')"></span></span>'+this[2]+'</dd>'
				});
				html += '</dl><hr/><ul class="build-costs">'
					+'<li class="credits" title="'+bc_credits[1]+'">'+bc_credits[0]+'</li>';
				$.each( bc_products, function(){
					html += '<li style="background-image:'+this[1].replace(/"/,'\'')+'" title="'+this[2]+'">'+this[0]+'</li>';
				});
				html += '</ul><ul class="maintenance-costs">';
				$.each( mc, function(i){
					html += '<li class="'+i+'" title="'+this[2]+'">'+(this[0]>0?'+':'')+this[0]+' / '+(this[1]>0?'+':'')+this[1]+'</li>';
				});
				html += '</ul><div class="clear"></div>';
				container.html(html);
			}
		});
		if( chains.length>1 )
			$(this).trigger('summarize');
	})
}

function getGroup( el ) {
	return $(el).hasClass('ecos') ? 'ecos' : ( $(el).hasClass('tycoons') ? 'tycoons' : 'techs' )
}

function filterNum( n ) {
	n = parseInt( n.replace(/[^0-9]/g,''), 10 );
	return isNaN(n) ? 0 : n;
}

$(document).ready(function(){

	baseurl = $('head base').attr('href');
	
	lang = $('html').attr('lang');

	$('input.first-focus:first').focus();
	
	$('.hidden').hide().removeClass('hidden');

	$('select').each(function(){
		$(this).selectmenu({
			style:'popup',
			handleWidth: 0
		})
	});

	$('input[type=checkbox]').each(function(){
		var checkbox = $(this),
			replacement = $('<a href="#" class="checkbox'+(checkbox.is(':checked')?' checked':'')+'"'+( checkbox.attr('tabindex')!=undefined ? ' tabindex="'+checkbox.attr('tabindex')+'"' : '' )+'/>')
		replacement.click(function(ev){
			ev.preventDefault();
			replacement.toggleClass('checked');
			checkbox.attr('checked', ( checkbox.is(':checked') ? false : true ) ).trigger('change');
		}).keypress(function(ev){
			if( ev.which==32 ) {
				ev.preventDefault();
				replacement.trigger('click');				
			}
		});
		if( checkbox.attr('tabindex')!=undefined )
			replacement.attr('tabindex',checkbox.attr('tabindex'))
		checkbox.after(replacement).hide();
	});
	
	$('#recaptcha_image').each(function(){
		$(this).click(function(ev){
			ev.preventDefault();
			$('#recaptcha_challenge_field_holder').remove();
			Recaptcha.create( recaptcha_public_key, 'recaptcha_image', {theme:'custom'} );
		}).click()
	});

	$('ul#user-menu').each(function(){
		var menu = $(this),
			info = $('#user-info');
		if( !menu.hasClass('logged-in') )
			info.hide();
		menu.find('li.logout a').each(function(){
			$(this).click(function(ev){
				ev.preventDefault();
				request({
					url: $(this).attr('href'),
					success: function(data) {
						if( data.success )
							location.href = data.redirect_to;
						else
							location.href = baseurl+$(this).attr('href');
					},
				});				
			})
		}).end().find('li.save').click(function(ev){
			ev.preventDefault();
			var hideTimer = null;
			if( menu.hasClass('logged-in') ) {
			}
			else {
				clearTimeout(hideTimer);
				info.fadeIn()
				hideTimer = window.setTimeout(function(){
					info.fadeOut();
				},4000);
			}
		});
	});

	$('#register-form,#login-form,#account-email-form,#account-password-form,#change-email-form,#password-lost-form,#password-lost-change-form,#resend-activation-form').each(function(){
		var form = $(this);
		form.find('span.error').slideUp(0).end().find('input[type=text],input[type=password]').each(function(){
			var input = $(this),
				changeTimer = null;
			$(this).change(function(){
				clearTimeout(changeTimer);
				if( input.attr('name')=='recaptcha_response_field' )
					return;
				if( input.attr('name')=='pwd' ) {
					if( form.attr('id')=='login-form' && form.find('input[name=login]').val()=='' )
						return;
					form.find('input[name=pwd2]').trigger('change');
				}
				request({
					url: form.attr('action'),
					data: form.serialize()+'&live_validate='+input.attr('name'),
					success: function(data) {
						input.removeClass('valid invalid');
						if( data.valid )
							input.addClass('valid').next('span.error').slideUp(400,function(){
								$(this).empty();
							});
						else
							input.addClass('invalid').next('span.error').html( data.error ).slideDown();
					},
					error: function() {}
				});
			}).keyup(function(ev){
				clearTimeout(changeTimer);
				if( ev.which!=13 && input.val()!='' )
					changeTimer = window.setTimeout(function(){
						input.trigger('change');
					},1000);
			});
		}).end().submit(function(ev){
			ev.preventDefault();
			request({
				url: form.attr('action'),
				data: form.serialize(),
				beforeSend: function() {
					form.find('input[type=submit]').addClass('loading').blur();
				},
				complete: function() {
					$('#recaptcha_image').click();
					form.find('input[type=submit]').removeClass('loading');
				},
				success: function(data) {
					if( data.success ) {
						switch( form.attr('id') ) {
							case 'login-form':
								location.href = data.redirect_to;
								break;
							case 'register-form':
								$('#recaptcha_image').remove();
							default:
								form.find('fieldset').height( form.find('fieldset').height() ).html('<p>'+data.success_msg+'</p>');
								break;
						}
					}
					else {
						form.find('input[type=text],input[type=password]').removeClass('valid invalid').each(function(){
							if( data.errors[ $(this).attr('name') ] )
								$(this).addClass('invalid').next('span.error').html( data.errors[ $(this).attr('name') ] ).slideDown();
							else if( $(this).val()!='' ) {
								$(this).next('span.error').slideUp(400,function(){
									$(this).empty();
								});
								if( $(this).attr('name')!='recaptcha_response_field' )
									$(this).addClass('valid');
							}
						})
						if( data.hint!=undefined ) {
							if( form.find('dd.hint').length<=0 )
								$(data.hint).slideUp(0).appendTo( form.find('dl') ).slideDown(400);
							else
								form.find('dd.hint').replaceWith(data.hint);
						}
					}
				}
			})
		})
	});
	
	$('#commoditychains-form').each(function(){
		var form = $(this),
			speed = 400;
			selectTimer = null;
		form.find('select').change(function(){
			clearTimeout(selectTimer);
			if( $(this).val()!='' ) {
				selectTimer = window.setTimeout(function(){
					form.submit();
				},400);				
			}
		}).end().submit(function(ev){
			ev.preventDefault();
			request({
				url: form.attr('action'),
				data: form.serialize(),
				beforeSend: function() {
					$('div.commodity-chain').fadeOut(speed);
				},
				complete: function() {
				},
				success: function(data) {
					if( data.success ) {
						var c = $(data.html).hide();
						processCommodityChain(c);
						if( $('div.commodity-chain').length>0 )
							$('div.commodity-chain').fadeOut(speed,function(){
								$(this).replaceWith(c);
								c.fadeIn(speed);
							});
						else {
							c.appendTo( $('#commodity-chain-container') ).fadeIn(speed);
						}
					}
				}
			})
		}).submit();
	});

	$('#database-search-form').each(function(){
		$(this).find('input[name=search]').each(function(){
			var input = $(this);
			input.autocomplete({
				source: function( request, response ) {
					$.ajax({
						url: input.attr('data-autocomplete'),
						dataType: 'json',
						data: 'text='+request.term,
						beforeSend: function() {
							input.closest('form').find('input[type=submit]').addClass('loading').blur();
						},
						complete: function() {
							input.closest('form').find('input[type=submit]').removeClass('loading');
						},
						success: function( data ) {
							response( $.map(
								data.results,
								function( item ) {
									return { label: item, value: item };
								}
							) );
						}
					});
				},
				minLength: 1,
				open: function() {
					$('.ui-autocomplete.ui-menu').css('width',$(this).outerWidth())
				},
			})
		})
	});
	
	$('#rda-import-form').each(function(){
		var form = $(this),
			response = $('p#response').slideUp(0);
		$(this).submit(function(ev){
			ev.preventDefault();
			request({
				url: form.attr('action'),
				data: form.serialize(),
				beforeSend: function() {
					response.slideUp();
					form.find('input[type=submit]').addClass('loading').blur();
				},
				complete: function() {
					form.find('input[type=submit]').removeClass('loading');
				},
				success: function(data) {
					response.html(data.msg).slideDown();
				}
			});				
		})
	});
	
	$('div.commodity-chain').each(function(){
		processCommodityChain(this);
	});
	
	$('form#population-form').each(function(){
		var form = $(this),
			fieldsets = [
				form.find('#residences-fieldset'),
				form.find('#inhabitants-fieldset'),
				form.find('#demands-fieldset'),
				form.find('#production-fieldset')
			]
			display_options_buttons = $('#display-options').find('li a'),
			residence_capacity = [ [ 8, 15, 25, 40 ], [ 5, 30 ] ];
		display_options_buttons.each(function(i){
			$(this).click(function(ev){
				ev.preventDefault();
				fieldsets[i].fadeToggle();
				$(this).toggleClass('active');
				$( $('#hidden-fieldset').find('input').get(i) ).value( $(this).hasClass('active') ? '1' : '0' );
			});
			if( !$(this).hasClass('active') ) {
				fieldsets[i].fadeOut(0);
				$( $('#hidden-fieldset').find('input').get(i) ).value('0');
			}
		});
		form.find('a.display-hide').each(function(i){
			$(this).click(function(ev){
				ev.preventDefault();
				$(display_options_buttons[i]).trigger('click');
			});
		}).end().bind({
			ssubmit: function(ev) {
				ev.preventDefault();
				request({
					url: form.attr('action'),
					data: form.serialize(),
					beforeSend: function() {
						form.find('input[type=submit]').addClass('loading').blur();
					},
					complete: function() {
						form.find('input[type=submit]').removeClass('loading');
					},
					success: function(data) {
						if( data.success ) {
							var d = [ data.demands, data.productions ];
							$('#demands-fieldset,#production-fieldset').each(function(i){
								$(this).find('li').each(function(){
									var guid = parseInt($(this).attr('data-guid')),
										text = '';
									if( d[i][guid]!=undefined && d[i][guid]>0 ) {
										text = d[i][guid].toFixed(1).toString();
										if( lang=='de' )
											text = text.replace(/\./,',');
										$(this).removeClass('no-demand').find('span.count').text( text );
									}
									else
										$(this).addClass('no-demand').find('span.count').empty();
								});
							});
						}
					}
				});
			}
		});
		$.each( fieldsets, function(i){
			$(this).bind({
				summarize: function(){
					$(this).find('dl').each(function(){
						var group = getGroup( this );
							valTotal = 0;
						for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
							valTotal += filterNum( $(this).find('dd.'+group+(i+1)+' input:first').val() );
						$(this).find('dd.'+group+'0 input[type=text]').val( valTotal );
					});
				}
			});
			if( i==0 ) {
				$(this).find('dl').each(function(){
					$(this).find('.slider').each(function(){
						$(this).slider({
							value: filterNum($(this).next().val()),
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
						});
					}).end().find('dd input[type=text]').filter(':first').each(function(){
						$(this).bind({
							change: function() {
								var dl = $(this).closest('dl'),
									group = getGroup( dl ),
									valTotal = filterNum( $(this).val() ),
									valUpgrade = filterNum( $(this).next().next().val() );
								$(this).val( valTotal );
								vals = [valTotal,0,0,0]
								for( var l=1; l<valUpgrade; l++ ) {
									vals[l] = Math.round( vals[l-1] * ( 0.2 * ((group=='techs'?4:5)-l) ) );
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
								$(this).attr('data-value',$(this).val());
							},
							keyup: function() {
								if( $(this).val()!='' && $(this).attr('data-value')!=$(this).val() )
									$(this).trigger('change');
							}
						});
					}).not(':first').each(function(){
						$(this).bind({
							change: function() {
								$(this).val( filterNum($(this).val()) );
								fieldsets[0].trigger('summarize');
								fieldsets[1].trigger('updateByResidences');
							}
						});
					});
				}).end().find('input[type=checkbox]').each(function(){
					$(this).change(function(){
						fieldsets[1].trigger('updateByResidences');
					});
				});
			}
			else if( i==1 ) {
				$(this).each(function(){
					$(this).bind({
						updateByResidences: function() {
							inhabitants = {};
							fieldsets[0].find('dl').each(function(){
								var group = getGroup( this ),
									capacity = residence_capacity[ group=='techs' ? 1 : 0 ],
									more_space = $(this).find('dd.'+group+'-ls input:first').is(':checked') ? 1.12 : 1;
								inhabitants[group] = [];
								for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
									inhabitants[group][i] = Math.round( filterNum( $(this).find('dd.'+group+(i+1)+' input').val() )*capacity[i]*more_space );
							});
							$(this).find('dl').each(function(){
								var group = getGroup( this );
								for( var i=0; i<( group=='techs' ? 2 : 4 ); i++ )
									 $(this).find('dd.'+group+(i+1)+' input:first').val( inhabitants[group][i] )
							});
							$(this).trigger('summarize');
						}
					});
				});
			}
		});
	});
	
});

