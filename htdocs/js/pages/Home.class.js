// Marketplace Home Page

// Copyright (c) 2019 - 2026 PixlCore LLC
// Released under the BSD 3-Clause License.
// See the LICENSE.md file in this repository.

Page.Home = class Home extends Page.Base {
	
	onInit() {
		// called once at page load
		var self = this;
	}
	
	onActivate(args) {
		// page activation
		if (!args) args = {};
		this.args = args;
		
		this.product = app.product_of_the_day;
		
		app.setWindowTitle('Home');
		app.setHeaderTitle( '<i class="mdi mdi-cart-variant">&nbsp;</i>Marketplace Home' );
		app.showSidebar(true);
		
		var html = '';
		var desc = '';
		
		// desc += `### Welcome to the xyOps Marketplace!\n`;
		// xyOps has an integrated Plugin Marketplace, so you can expand the app's feature set by leveraging Plugins published both by PixlCore (the makers of xyOps), as well as the developer community.
		
		desc += `\nThe marketplace allows you to download and install plugins created by PixlCore (the makers of xyOps) and the developer community.  All plugins are checked by PixlCore before publishing to ensure quality and safety, but always use caution when downloading software from the internet.\n`;
		
		desc += `\nThis site allows you to browse the plugin directory and discover new ways to expand the xyOps feature set.  To actually install a Plugin, use the in-app Marketplace link found in the xyOps UI.\n`;
		
		desc += `\nWant to publish your own Plugins?  Check out the [Marketplace Documentation](https://docs.xyops.io/marketplace).\n`;
		
		html += `
			<div class="box">
				<div class="box_title doc">Welcome to the xyOps Marketplace!</div>
				<div class="box_content table">
					<div class="markdown-body desc-body">${marked.parse(desc, config.ui.marked_config)}</div>
				</div>
			</div>
		`;
		
		// product of the day
		html += '<div class="box" id="d_potd">';
			html += '<div class="box_title doc">';
				html += 'Product of the Day';
				html += '<div class="button right" onClick="$P().do_view_potd()"><i class="mdi mdi-arrow-right-circle-outline">&nbsp;</i>View Details...</div>';
			html += '</div>';
			html += '<div class="box_content table">';
				html += '<div class="loading_container"><div class="loading"></div></div>';
			html += '</div>'; // box_content
		html += '</div>'; // box
		
		this.div.html( html );
		
		app.api.get( 'app/marketplace', { id: app.product_of_the_day.id, readme: 1 }, this.receive_potd.bind(this) );
		
		return true;
	}
	
	receive_potd(resp) {
		// display potd readme content
		var text = resp.text;
		var html = '';
		
		html += '<div class="markdown-body doc-body" style="margin-top:0px; margin-bottom:15px;">';
		html += marked.parse(text, config.ui.marked_config);
		html += '</div>'; // markdown-body
		
		$('#d_potd > div.box_content').html( html );
		$('#d_potd').show();
		
		// fix article links, etc.
		this.expandInlineImages('#d_potd');
		this.highlightCodeBlocks('#d_potd');
		this.fixMarketDocumentLinks('#d_potd');
	}
	
	do_view_potd() {
		// nav to potd detail page
		var product = app.product_of_the_day;
		Nav.go( 'Marketplace?id=' + encodeURIComponent(product.id) );
	}
	
	onDeactivate() {
		// called when page is deactivated
		this.div.html( '' );
		return true;
	}
	
};
