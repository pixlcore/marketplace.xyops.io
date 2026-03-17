// Marketplace Page

// Copyright (c) 2019 - 2026 PixlCore LLC
// Released under the BSD 3-Clause License.
// See the LICENSE.md file in this repository.

Page.Marketplace = class Marketplace extends Page.Base {
	
	onInit() {
		// called once at page load
		this.default_sub = 'search';
		this.bar_width = 100;
	}
	
	onActivate(args) {
		// page activation
		if (!args) args = {};
		if (!args.sub && args.id) args.sub = 'view';
		if (!args.sub) args.sub = this.default_sub;
		this.args = args;
		
		app.showSidebar(true);
		
		this['gosub_'+args.sub](args);
		
		return true;
	}
	
	gosub_search(args) {
		// search marketplace
		var self = this;
		var args = this.args;
		this.fields = app.fields;
		
		// possibly highlight special sidebar tab
		var temp_args = { ...args };
		delete temp_args.sub;
		
		if (num_keys(temp_args) == 1) {
			var arg_key = first_key(temp_args);
			var arg_value = args[arg_key];
			var tab_id = 'mkt_' + arg_key + '_' + crammify(arg_value);
			if ($('#tab_' + tab_id).length) app.highlightTab(tab_id);
		}
		
		if (args.plugin_type) args.type = 'plugin';
		
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = config.items_per_page;
		
		app.setWindowTitle('Marketplace Search');
		app.setHeaderTitle( '<i class="mdi mdi-cart-variant">&nbsp;</i>Marketplace Search' );
		
		var html = '';
		html += '<div class="box" style="border:none;">';
		html += '<div class="box_content" style="padding:20px;">';
			
			// search box
			html += '<div class="search_box" role="search">';
				html += '<i class="mdi mdi-magnify" onClick="$(\'#fe_s_query\').focus()">&nbsp;</i>';
				html += '<input type="text" id="fe_s_query" maxlength="128" placeholder="Enter keywords..." value="' + escape_text_field_value(args.query || '') + '">';
			html += '</div>';
			
			// options
			html += '<div id="d_s_adv" class="form_grid" style="margin-bottom:25px">';
				
				// type
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-palette-swatch-outline">&nbsp;</i>Product Type:',
						content: this.getFormMenuSingle({
							id: 'fe_s_type',
							title: 'Select Type',
							options: [['', 'Any Type']].concat( this.fields.types.map( function(type) {
								var def = config.ui.data_types[type];
								if (def) return { id: type, title: toTitleCase(type), icon: def.icon };
								else return type;
							} ) ).concat( [
								{ id: 'p_action', title: 'Action Plugins', icon: 'gesture-tap', group: "Plugin Types" },
								{ id: 'p_event', title: 'Event Plugins', icon: 'calendar-clock' },
								{ id: 'p_monitor', title: 'Monitor Plugins', icon: 'console' },
								{ id: 'p_scheduler', title: 'Trigger Plugins', icon: 'rocket-launch-outline' }
							] ),
							value: args.plugin_type ? `p_${args.plugin_type}` : (args.type || ''),
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// tags
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-tag-multiple-outline">&nbsp;</i>Tags:',
						content: this.getFormMenuMulti({
							id: 'fe_s_tags',
							title: 'Select Tags',
							placeholder: 'Any Tags',
							options: this.fields.tags.map( function(tag) {
								return { id: crammify(tag), title: tag, icon: 'tag-outline' };
							} ),
							values: args.tags ? args.tags.split(/\,\s*/) : [],
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// requirements
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-disc-player">&nbsp;</i>Requirements:',
						content: this.getFormMenuMulti({
							id: 'fe_s_reqs',
							title: 'Select Requirements',
							placeholder: 'Any Requirements',
							options: this.fields.requires.map( function(req) {
								return { id: crammify(req), title: req, icon: 'floppy' };
							} ),
							values: args.requires ? args.requires.split(/\,\s*/) : [],
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// author
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-account">&nbsp;</i>Author:',
						content: this.getFormMenuSingle({
							id: 'fe_s_author',
							title: 'Select Author',
							options: [['', 'Any Author']].concat( this.fields.authors.map( function(author) {
								return { id: crammify(author), title: author, icon: 'account' };
							} ) ),
							value: args.author || '',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// license
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-scale-balance">&nbsp;</i>License:',
						content: this.getFormMenuSingle({
							id: 'fe_s_lic',
							title: 'Select License',
							options: [['', 'Any License']].concat( this.fields.licenses.map( function(lic) {
								return { id: crammify(lic), title: lic, icon: 'license' };
							} ) ),
							value: args.license || '',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
			html += '</div>'; // form_grid
		
		// buttons at bottom
		html += '<div class="box_buttons" style="padding:0">';
			// html += '<div id="btn_search_opts" class="button phone_collapse" onClick="$P().toggleSearchOpts()"><i>&nbsp;</i><span>Options<span></div>';
			html += '<div id="btn_s_reset" class="button phone_collapse" style="display:none" onClick="$P().resetFilters()"><i class="mdi mdi-undo-variant">&nbsp;</i>Reset</div>';
			html += '<div class="button primary" onClick="$P().navSearch(true)"><i class="mdi mdi-magnify">&nbsp;</i>Search</div>';
		html += '</div>'; // box_buttons
		
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		html += '<div id="d_search_results"><div class="loading_container"><div class="loading"></div></div></div>';
		
		this.div.html( html ).buttonize();
		// this.addPageDescription();
		
		MultiSelect.init( this.div.find('#fe_s_tags, #fe_s_reqs') );
		SingleSelect.init( this.div.find('#fe_s_type, #fe_s_lic, #fe_s_author') );
		// this.setupSearchOpts();
		
		this.div.find('#fe_s_tags, #fe_s_type, #fe_s_reqs, #fe_s_lic, #fe_s_author').on('change', function() {
			self.navSearch();
		});
		
		$('#fe_s_query').on('keydown', function(event) {
			// capture enter key
			if (event.keyCode == 13) {
				event.preventDefault();
				self.navSearch(true);
			}
		});
		
		setTimeout( function() { 
			// do this in another thread to ensure that Nav.loc is updated
			// not to mention user_nav
			self.doSearch();
		}, 1 );
	}
	
	resetFilters() {
		// reset all filters to default and re-search
		Nav.go( this.selfNav({}) );
	}
	
	getSearchArgs() {
		// get form values, return search args object
		var args = {};
		
		var query = this.div.find('#fe_s_query').val().trim();
		if (query.length) args.query = query;
		
		var tags = this.div.find('#fe_s_tags').val();
		if (tags.length) args.tags = tags.join(',');
		
		var reqs = this.div.find('#fe_s_reqs').val();
		if (reqs.length) args.requires = reqs.join(',');
		
		var lic = this.div.find('#fe_s_lic').val();
		if (lic) args.license = lic;
		
		var author = this.div.find('#fe_s_author').val();
		if (author) args.author = author;
		
		var type = this.div.find('#fe_s_type').val();
		if (type) {
			if (type.match(/^p_(\w+)$/)) {
				var plugin_type = RegExp.$1;
				args.type = 'plugin';
				args.plugin_type = plugin_type;
			}
			else args.type = type;
		}
		
		if (!num_keys(args)) return null;
		
		return args;
	}
	
	navSearch(force = false) {
		// convert form into query and redirect
		app.clearError();
		
		var args = this.getSearchArgs();
		if (!args) {
			// args = { query: '*' };
			Nav.go( this.selfNav({}) );
			return;
		}
		
		Nav.go( this.selfNav(args), force );
	}
	
	doSearch() {
		// actually perform the search
		var args = this.args;
		var sargs = this.getSearchArgs() || {};
		
		if (first_key(sargs)) this.div.find('#btn_s_reset').show();
		else this.div.find('#btn_s_reset').hide();
		
		// compose search query
		var sopts = {
			...sargs,
			offset: args.offset || 0,
			limit: args.limit || config.items_per_page,
			compact: 1
		};
		
		app.api.get( 'app/marketplace', sopts, this.receiveResults.bind(this) );
	}
	
	receiveResults(resp) {
		// receive search results
		var self = this;
		var $results = this.div.find('#d_search_results');
		var html = '';
		
		if (!this.active) return; // sanity
		
		this.lastSearchResp = resp;
		
		this.products = (resp.rows || []).map( function(product) {
			var modified = Math.floor( (new Date(product.modified + ' 00:00:00')).getTime() / 1000 );
			return {
				...product,
				modified_sort: modified,
				version: product.versions[0],
				version_sort: get_int_version( product.versions[0] )
			};
		} );
		
		var table_opts = {
			id: 't_marketplace',
			item_name: 'product',
			sort_by: 'title',
			sort_dir: 1,
			filter: '',
			column_ids: ['title', 'author', 'license', 'type', 'modified_sort', 'version_sort' ],
			column_labels: ['Title', 'Author', 'License', 'Type', 'Modified', 'Version']
		};
		
		html += '<div class="box">';
		
		html += '<div class="box_title">';
			html += this.getSearchArgs() ? 'Search Results' : 'All Products';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		html += '<div class="box_content table">';
		
		html += this.getSortableTable( this.products, table_opts, function(product) {
			var logo_url = app.base_api_url + '/app/marketplace?id=' + encodeURIComponent(product.id) + '&logo=1';
			
			var combo = `<div class="product_result" data-product="${product.id}" onClick="$P().doViewProduct(this)" style="background-image:url(${logo_url}">`;
				combo += `<div class="product_title ellip">${product.title}</div>`;
				combo += `<div class="product_desc ellip">${ inline_marked(product.description) }</div>`;
			combo += `</div>`;
			
			return [
				combo,
				self.getNiceProductAuthor( product.author ),
				self.getNiceProductLicense( product.license ),
				self.getNiceProductType( product ),
				self.getNiceProductDate( product.modified ),
				self.getNiceProductVersion( product.versions[0] )
			];
		}); // getSortableTable
		
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		$results.html( html ).buttonize();
		
		this.cleanupBoxButtonFloater();
	}
	
	getNiceProductType(product) {
		// { id: type, title: toTitleCase(type), icon: def.icon };
		if (product.plugin_type) return this.getNicePluginType(product.plugin_type);
		
		var def = config.ui.data_types[product.type];
		if (def) return `<i class="mdi mdi-${def.icon}">&nbsp;</i>` + toTitleCase(product.type);
		else return type;
	}
	
	getNiceProductAuthor(author) {
		return '<i class="mdi mdi-account">&nbsp;</i>' + author;
	}
	
	getNiceProductLicense(lic) {
		return '<i class="mdi mdi-license">&nbsp;</i>' + lic;
	}
	
	getNiceProductVersion(ver) {
		return '<i class="mdi mdi-tag-text-outline">&nbsp;</i>' + ver;
	}
	
	getNiceProductDate(date) {
		var epoch = Math.floor( (new Date(date + ' 00:00:00')).getTime() / 1000 );
		return this.getNiceDate(epoch);
	}
	
	getNiceProductReq(req) {
		return '<i class="mdi mdi-floppy">&nbsp;</i>' + req;
	}
	
	getNiceProductRequires(reqs) {
		return reqs.map( req => this.getNiceProductReq(req) ).join(', ');
	}
	
	doViewProduct(elem) {
		// jump to product view page by index
		var id = $(elem).data('product');
		Nav.go( 'Marketplace?id=' + encodeURIComponent(id) );
	}
	
	// View Page
	
	gosub_view(args) {
		// view marketplace product
		this.loading();
		
		// look for inline page anchor
		if (args.id.match(/^(.+?)\/(.+?)\/(.+?)$/)) {
			args.id = RegExp.$1 + '/' + RegExp.$2;
			args.anchor = RegExp.$3;
		}
		
		app.api.get( 'app/marketplace', { id: args.id, readme: 1 }, this.receive_product.bind(this), this.fullPageError.bind(this) );
	}
	
	receive_product(resp) {
		// display product landing page
		var self = this;
		var product = this.product = resp.item;
		var text = resp.text;
		var type_def = config.ui.data_types[ product.type ];
		var html = '';
		
		app.setWindowTitle( product.title );
		app.setHeaderNav([
			{ icon: 'cart-outline', loc: '#Marketplace?sub=search', title: 'Marketplace' },
			{ icon: type_def.icon, title: product.title }
		]);
		
		// summary grid
		html += '<div class="box">';
			html += '<div class="box_title">';
				html += product.title;
				
				html += '<div class="button secondary right phone_collapse" onClick="$P().doVisitRepo()"><i class="mdi mdi-open-in-new">&nbsp;</i>Visit Repo...</div>';
				
				// html += '<div class="button ' + install_btn_class + ' right phone_collapse" title="' + install_btn_text + '" onClick="$P().do_install_select_version()"><i class="mdi mdi-' + install_btn_icon + '">&nbsp;</i><span>' + install_btn_text + '</span></div>';
				// if (g) {
				// 	html += '<div class="button right secondary phone_collapse" title="Clone for editing..." onClick="$P().do_clone()"><i class="mdi mdi-file-edit-outline">&nbsp;</i><span>Clone...</span></div>';
				// }
				// html += '<div class="button right danger phone_collapse" title="Report..." onClick="$P().doReport()"><i class="mdi mdi-alert-octagon-outline">&nbsp;</i><span>Report...</span></div>';
				html += '<div class="clear"></div>';
			html += '</div>'; // title
			
			html += '<div class="box_content table">';
				html += '<div class="summary_grid">';
					
					// author
					html += '<div>';
						html += '<div class="info_label">Author</div>';
						html += '<div class="info_value">' + this.getNiceProductAuthor(product.author) + '</div>';
					html += '</div>';
					
					// type
					html += '<div>';
						html += '<div class="info_label">Type</div>';
						html += '<div class="info_value">' + this.getNiceProductType(product) + '</div>';
					html += '</div>';
					
					// status (installed / not)
					html += '<div>';
						html += '<div class="info_label">Status</div>';
						html += '<div class="info_value"><i class="mdi mdi-check-circle-outline">&nbsp;</i>Active</div>';
					html += '</div>';
					
					// installed version
					html += '<div>';
						html += '<div class="info_label">Version</div>';
						html += '<div class="info_value">' + this.getNiceProductVersion(product.versions[0]) + '</div>';
					html += '</div>';
					
					// license
					html += '<div>';
						html += '<div class="info_label">License</div>';
						html += '<div class="info_value">' + this.getNiceProductLicense(product.license) + '</div>';
					html += '</div>';
					
					// requires
					html += '<div>';
						html += '<div class="info_label">Requirements</div>';
						html += '<div class="info_value">' + this.getNiceProductRequires(product.requires) + '</div>';
					html += '</div>';
					
					// created
					html += '<div>';
						html += '<div class="info_label">Created</div>';
						html += '<div class="info_value">' + this.getNiceProductDate(product.created) + '</div>';
					html += '</div>';
					
					// modified
					html += '<div>';
						html += '<div class="info_label">Modified</div>';
						html += '<div class="info_value">' + this.getNiceProductDate(product.modified) + '</div>';
					html += '</div>';
					
				html += '</div>'; // summary grid
				
			html += '</div>'; // box content
		html += '</div>'; // box
		
		// markdown
		html += '<div class="box">';
		
		html += '<div class="box_content">';
		// html += '<div class="button secondary right" onClick="$P().doVisitRepo()"><i class="mdi mdi-open-in-new">&nbsp;</i>Visit Repo...</div>';
		html += '<div class="markdown-body doc-body" style="margin-top:0px; margin-bottom:15px;">';
		
		html += marked.parse(text, config.ui.marked_config);
		
		html += '</div>'; // markdown-body
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		this.div.html(html);
		
		// fix article links, etc.
		this.expandInlineImages();
		this.highlightCodeBlocks();
		this.fixMarketDocumentLinks();
	}
	
	gosub(sub) {
		// scroll to sub-anchor
		if (!sub) {
			window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
			return;
		}
		var id = 'h_' + sub;
		var $heading = this.div.find('div.markdown-body').find('#' + id);
		if ($heading.length) {
			$heading[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
			this.args.anchor = sub;
		}
	}
	
	doVisitRepo() {
		// open new window to plugin's repo
		// future-proofing, default to github for v1
		var repo_base_url = this.product.repo_url || `https://github.com/${this.product.id}`;
		window.open( repo_base_url );
	}
	
	doReport() {
		// open a github issue for starting a report
		// future-proofing, default to github for v1
		var repo_base_url = this.product.repo_url || `https://github.com/${this.product.id}`;
		
		var url = "https://github.com/pixlcore/xyops-marketplace/issues/new" + compose_query_string({
			title: `Report Plugin: ${this.product.title} (${this.product.id})`,
			body: `I'd like to report the following marketplace plugin:\n\n` + 
				`- **Name**: ${this.product.title}\n` + 
				`- **ID**: \`${this.product.id}\`\n` + 
				`- **Repo**: ${repo_base_url}\n\n` + 
				`### Reason for Reporting:\n\n`
		});
		
		window.open(url);
	}
	
	onDeactivate() {
		// called when page is deactivated
		this.div.html('');
		
		delete this.lastSearchResp;
		delete this.products;
		delete this.product;
		
		return true;
	}
	
};
