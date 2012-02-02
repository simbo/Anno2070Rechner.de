
var baseurl, lang;

function request( _options ) {
	var options = $.extend({
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

function getGroup( el ) {
	return $(el).hasClass('ecos') ? 'ecos' : ( $(el).hasClass('tycoons') ? 'tycoons' : 'techs' )
}

function filterNum( n ) {
	if( n==undefined )
		return 0;
	n = parseInt( n.replace(/[^0-9-]/g,''), 10 );
	return isNaN(n) ? 0 : n;
}

function getEfficiencyClass( percent ) {
	classes = ['green','lightgreen','yellow','orange','red'];
	percent = parseInt(percent)-1;
	return classes[ 4-Math.floor( percent/20 ) ];
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

function setProductivityEvents( el ) {
	
	// window event to hide productivity slider
	$(window).unbind('click.productivities').bind({
		'click.productivities': function(){
			var f = $('.production.active .productivity').find(':focus');
			if( f.length<1 )
				$('.production.active').trigger('deactivate');
		}
	});
	
	$(el).each(function(){

		var production = $(this).closest('.production');
	
		production.bind({
			activate: function() {
				$(this).addClass('active')
				$(this).closest('.commodity-chain').find('.production').not(this).trigger('deactivate');
			},
			deactivate: function() {
				$(this).removeClass('active')
				production.trigger('updateChildren');
			},
			update: function() {
				var p = $(this),
					tpm = parseFloat(p.attr('data-tpm')),
					tpm_needed = parseFloat(p.attr('data-tpm-needed')),
					productivity = filterNum($(this).find('input').val())/100
					count = tpm_needed / ( tpm * productivity ),
					original_count = parseInt(p.attr('data-count')),
					efficiency = Math.round((count/Math.ceil(count))*100).toString(),
					//actual_tpm = 0;
				p.find('span.count').html( '&times;'+Math.ceil(count).toString() );
				p.find('.efficiency').text( efficiency+'%' ).attr('class','efficiency '+getEfficiencyClass(efficiency));
				count = Math.ceil(count);
				/*
				actual_tpm = ( Math.round( tpm*productivity*count*10 ) / 10 ).toString();
				if( lang=='de' )
					actual_tpm = actual_tpm.replace(/\./,',');
				p.closest('dl').find('dt div.product:first').find('.tpm .actual').text(actual_tpm)
				*/
				if( original_count!=count ) {
					p.find('.build-costs li').each(function(){
						$(this).text( (parseInt($(this).text())/original_count)*count );
					});
					p.find('.maintenance-costs li').each(function(){
						var v = $(this).text().split('/')
						$(this).text( ((parseInt(v[0])/original_count)*count).toString()+' / '+((parseInt(v[1])/original_count)*count).toString() );
					});
					p.attr('data-count',count);
					p.addClass('changed');
				}
			},
			updateChildren: function() {
				var chain = $(this).closest('.commodity-chain');
				if( chain.length>0 && $(this).hasClass('changed') ) {
					if( $(this).parent().closest('div').find('.commodity-chain-inner').length>0 ) {
						var productions = chain.find('.production'),
							productivity = [],
							preferred = [];
						productions.each(function(){
							productivity.push( 'productivity['+$(this).attr('data-guid')+']='+$(this).find('.productivity input').val() );
							if( !$(this).closest('dd').hasClass('alt') )
								preferred.push( 'preferred[]='+$(this).attr('data-guid') );
						});
						first_production = productions.filter(':first');
						request({
							url: 'get-commoditychain'+(lang!='de'?'/'+lang:''),
							data: 'pb_guid='+first_production.attr('data-guid')+'&tpm_needed='+first_production.attr('data-tpm-needed')+'&'+productivity.join('&')+'&'+preferred.join('&'),
							success: function(data) {
								var c = $(data.html),
									speed = 400;
								processCommodityChain(c);
								if( $('div.commodity-chain').length>0 )
									$('div.commodity-chain').replaceWith(c);
								else
									c.hide().appendTo( $('#commodity-chain-container') ).fadeIn(speed);
								setProductivityEvents(c.find('span.productivity'));
							}
						});
					}
					else if( chain.find('.production').length>1 )
						$('div.commodity-chain').trigger('summarize');
				}
			}
		})
		
		$(this).bind({
			click: function(ev) {
				$(this).find('input').focus();
				ev.stopPropagation();
			}
		});
	
		$(this).find('input').bind({
			focus: function() {
				$(this).select();
				production.trigger('activate');
			},
			change: function() {
				var v = Math.max(1,Math.min(999,filterNum($(this).val())))
				$(this).val( v );
				$(this).closest('.productivity').find('.slider').slider('value',v);
				production.trigger('update');
			},
			keydown: function() {
				$(this).attr('data-value',$(this).val());
			},
			keyup: function() {
				if( $(this).val()!='' && $(this).attr('data-value')!=$(this).val() )
					$(this).trigger('change');
			}
		});
		
		$(this).find('.slider').each(function(){
			$(this).slider({
				value: filterNum($(this).parent().prev().prev().val()),
				range: 'min',
				min: 50,
				max: 300,
				step: 1,
				stop: function() {
					production.trigger('deactivate');
				},
				slide: function( ev, ui ) {
					$(this).parent().prev().prev().val( ui.value );
					production.trigger('update')
				}
			});
		}).find('.ui-slider-handle').unbind('blur').bind({
		});
	});
}

$(document).ready(function(){

	baseurl = $('head base').attr('href');
	
	lang = $('html').attr('lang');

	$('input.first-focus:first').focus();
	
	$('input[type=text],input[type=password]').focus(function(){
		$(this).select();
	});
	
	$('.hidden').hide().removeClass('hidden');

	$('select').each(function(){
		$(this).selectmenu({
			style:'popup',
			handleWidth: 0
		});
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
					}
				});
			});
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
		}).end().find('input[name=search]').each(function(){
			var input = $(this);
			input.autocomplete({
				source: function( request, response ) {
					autocomplete_request = $.ajax({
						url: input.attr('data-autocomplete'),
						dataType: 'json',
						data: 'text='+request.term+'&type=production',
						beforeSend: function() {
							form.find('input[type=submit]').addClass('loading').blur();
						},
						complete: function() {
							form.find('input[type=submit]').removeClass('loading');
						},
						success: function( data ) {
							response( $.map(
								data.results,
								function( item ) {
									return {
										label: item[0],
										guid: item[3]!=undefined ? item[3] : item[1],
										value: item[2]!=undefined ? item[2] : item[0]
									};
								}
							) );
						}
					});
				},
				minLength: 1,
				open: function() {
					$('.ui-autocomplete.ui-menu').css('width',$(this).outerWidth())
				},
				select: function(ev,ui) {
					input.attr('data-guid',ui.item.guid);
					form.trigger('submit');
				}
			})
		}).end().submit(function(ev){
			ev.preventDefault();
			var s = form.find('input[name=search]');
			if( s.attr('data-guid')!='' ) {
				form.find('select').selectmenu( 'value', s.attr('data-guid') );
				s.attr('data-guid','')
			}
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
					if( data.html ) {
						var c = $(data.html);
						processCommodityChain(c);
						if( $('div.commodity-chain').length>0 )
							$('div.commodity-chain').replaceWith(c);
						else
							c.hide().appendTo( $('#commodity-chain-container') ).fadeIn(400);
						setProductivityEvents(c.find('span.productivity'));
					}
				}
			})
		}).submit();
	});

	$('div.commodity-chain').each(function(){
		processCommodityChain(this);
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
	
	$('#database-search-form,#database-select-form').each(function(i){
		var form = $(this);
		$(this).submit(function(ev){
			ev.preventDefault();
			request({
				url: form.attr('action'),
				data: form.serialize(),
				beforeSend: function() {
					$('#database-search-form').find('input[type=submit]').addClass('loading').blur();
				},
				complete: function() {
					$('#database-search-form').find('input[type=submit]').removeClass('loading').end().find('input[type=text]').autocomplete('close');
				},
				success: function(data) {
					$('.results').html(data.html);
				}
			})
		});
		if( $(this).attr('id')=='database-search-form' ) {
			form.find('input[name=search]').each(function(){
				var input = $(this);
				input.autocomplete({
					source: function( request, response ) {
						autocomplete_request = $.ajax({
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
					}
				})
			});
		}
		if( $(this).attr('id')=='database-select-form' ) {
			form.find('select').change(function() {
				form.find('select').not(this).selectmenu('value','');
				form.trigger('submit');
			})
		}
	});
	
});

