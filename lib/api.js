// xyOps Marketplace API Layer
// Copyright (c) 2026 Joseph Huckaby

const fs = require('fs');
const Path = require('path');
const os = require('os');
const assert = require("assert");
const async = require('async');
const Tools = require("pixl-tools");
const marked = require('marked');
const PixlRequest = require("pixl-request");

const config = require('../config.json');

// setup marked
marked.use({ renderer: {
	
	link(href, title, text) {
		const titleAttr = title ? ` title="${title}"` : '';
		if (href.match(/^\w+\:\/\//)) return `<a href="${href}" target="_blank"${titleAttr}>${text}<i style="padding-left:3px" class="mdi mdi-open-in-new"></i></a>`;
		else return `<a href="${href}" ${titleAttr}>${text}</a>`;
	},
	
	checkbox(checked) {
		const icon = checked ? 'mdi-checkbox-marked-outline' : 'mdi-checkbox-blank-outline';
		return `<i class="mdi ${icon}" aria-hidden="true"></i>`;
	},
	
	blockquote: function(html) {
		html = html.trim().replace(/^<p>([\s\S]+)<\/p>$/, '$1');
		
		if (html.match(/^\[\!(\w+)\]\s*/)) {
			var type = RegExp.$1.toLowerCase();
			var title = Tools.ucfirst(type);
			var icons = { note: 'information-outline', tip: 'lightbulb-on-outline', important: 'alert-decagram', warning: 'alert-circle', caution: 'fire-alert' };
			var icon = icons[type];
			
			html = html.replace(/^\[\!(\w+)\]\s*/, '');
			return `<div class="blocknote ${type}"><div class="bn_title"><i class="mdi mdi-${icon}">&nbsp;</i>${title}</div><div class="bn_content">${html}</div></div>`;
		}
		else return `<blockquote>${html}</blockquote>`;
	}
	
} }); // marked.use

module.exports = {
	
	startup: function(callback) {
		// here we go
		this.request = new PixlRequest( "PixlCore.com v1.0" );
		this.request.setTimeout( 30 * 1000 );
		this.request.setFollow( 5 );
		this.request.setAutoError( true );
		this.request.setKeepAlive( true );
		
		callback();
	},
	
	handler: function(args, callback) {
		// handler for doc requests
		var uri = args.request.url.replace(/\?.*$/, '');
		
		if (uri.match(/\/api\/app\/(\w+)/)) {
			var func = 'api_' + RegExp.$1;
			if (!this[func]) return callback( "404 Not Found", {}, "Nope." );
			this[func](args, callback);
		}
		else {
			callback( "404 Not Found", {}, "Nope." );
		}
	},
	
	send_json_ttl_response(json, callback) {
		// send cacheable json response
		var payload = JSON.stringify(json);
		callback( "200 OK", { 'Content-Type': "application/json", 'Cache-Control': "public, max-age=" + config.ttl }, payload );
	},
	
	api_run(args, callback) {
		// bootstrap
		var payload = 'app.receiveConfig(' + JSON.stringify(config) + ');' + "\n";
		callback( "200 OK", { 'Content-Type': "text/javascript", 'Cache-Control': "public, max-age=" + config.ttl }, payload );
	},
	
	api_marketplace(args, callback) {
		// make search or fetch request to the xyops marketplace system
		// search: { query?, type?, license?, tags?, requires?, sort_by?, sort_dir?, offset?, limit? }
		// fetch: { id, version?, readme?, data?, logo? }
		// fields: { fields }
		var self = this;
		var params = args.query;
		var marketplace = config.marketplace || {};
		var cache_file = Path.join( os.tmpdir(), 'marketplace.json' );
		
		var crammify = function(text) {
			// lower-case alphanumeric, strip everything else off
			return String(text).replace(/\W+/g, '').toLowerCase();
		};
		
		var includesAllCrammified = function(haystack, needles) {
			// crammified string version of Tools.includesAll
			const normalizedHaystack = haystack.map(s => crammify(s));
			return needles.every(n =>
				normalizedHaystack.includes(crammify(n))
			);
		};
		
		var finish = function(metadata) {
			if (params.id) {
				// fetch file from specific plugin
				var item = Tools.findObject( metadata.rows, { id: params.id } );
				if (!item) return self.doError( 'marketplace', "Marketplace item not found", callback );
				
				if (params.readme) {
					// fetch readme
					var ver = params.version || item.versions[0];
					var url = Tools.sub( marketplace.repo_url_template, {
						id: params.id,
						version: ver,
						filename: 'README.md'
					} );
					
					self.request.get( url, { retries: 8, retryDelay: 50 }, function(err, resp, data, perf) {
						if (err) return self.doError( 'marketplace', "Failed to fetch README: " + err, callback );
						
						// try to fix image src urls if relative
						var text = data.toString().replace(/(<img.*?src\s*\=\s*\")([^\"]*)(\"[^>]*>)/ig, function(m_all, m_g1, m_g2, m_g3) {
							if (!m_g2.match(/^\w+\:\/\//)) {
								return m_g1 + Tools.sub( marketplace.repo_url_template, { id: params.id, version: ver, filename: m_g2 } ) + m_g3;
							}
							else return m_all;
						});
						
						self.send_json_ttl_response({ code: 0, item, version: ver, text }, callback);
					});
					return;
				}
				else if (params.data) {
					// fetch data (xypdf)
					var ver = params.version || item.versions[0];
					var url = Tools.sub( marketplace.repo_url_template, {
						id: params.id,
						version: ver,
						filename: 'xyops.json'
					} );
					
					self.request.json( url, false, { retries: 8, retryDelay: 50 }, function(err, resp, data, perf) {
						if (err) return self.doError( 'marketplace', "Failed to fetch data: " + err, callback );
						self.send_json_ttl_response({ code: 0, item, version: ver, data: data }, callback);
					});
					return;
				}
				else if (params.logo) {
					// fetch logo
					var url = Tools.sub( marketplace.repo_url_template, {
						id: params.id,
						version: params.version || item.versions[0],
						filename: 'logo.png'
					} );
					
					self.request.get( url, { retries: 8, retryDelay: 50 }, function(err, resp, data, perf) {
						if (err) return self.doError( 'marketplace', "Failed to fetch README: " + err, callback );
						callback( "200 OK", { 'Content-Type': 'image/png', 'Cache-Control': "public, max-age=31536000" }, data );
					});
					return;
				}
				else return self.doError('api', "Invalid API request", callback);
			} // id
			else if (params.fields) {
				// return all unique field values (tags, licenses, etc.)
				var fields = { types: {}, plugin_types: {}, requires: {}, tags: {}, licenses: {}, authors: {} };
				
				metadata.rows.forEach( function(row) {
					if (row.type) fields.types[ row.type ] = 1;
					if (row.plugin_type) fields.plugin_types[ row.plugin_type ] = 1;
					if (row.license) fields.licenses[ row.license ] = 1;
					if (row.author) fields.authors[ row.author ] = 1;
					(row.requires || []).forEach( function(req) { fields.requires[req] = 1; } );
					(row.tags || []).forEach( function(tag) { fields.tags[tag] = 1; } );
				} );
				
				fields.types = Tools.hashKeysToArray(fields.types).sort();
				fields.plugin_types = Tools.hashKeysToArray(fields.plugin_types).sort();
				fields.requires = Tools.hashKeysToArray(fields.requires).sort();
				fields.tags = Tools.hashKeysToArray(fields.tags).sort();
				fields.licenses = Tools.hashKeysToArray(fields.licenses).sort();
				fields.authors = Tools.hashKeysToArray(fields.authors).sort();
				
				if (params.run) {
					// first run, also include product of the day
					var day_hash = Tools.digestHex( Tools.formatDate( Tools.timeNow(true), '[yyyy]/[mm]/[dd]' ), 'md5' );
					var day_id = parseInt( day_hash.substring(0, 8), 16 ); // 32-bit numerical hash
					var product_of_the_day = metadata.rows[ day_id % metadata.rows.length ];
					var payload = 'app.receiveConfig(' + JSON.stringify( { ...config, fields, product_of_the_day } ) + ');' + "\n";
					return callback( "200 OK", { 'Content-Type': "text/javascript", 'Cache-Control': "public, max-age=" + config.ttl }, payload );
				}
				else {
					return self.send_json_ttl_response({ code: 0, fields }, callback);
				}
			} // fields
			
			if (params.tags && (typeof(params.tags) == 'string')) params.tags = params.tags.split(/\,\s*/);
			if (params.requires && (typeof(params.requires) == 'string')) params.requires = params.requires.split(/\,\s*/);
			
			// apply user search filters
			var rows = metadata.rows.filter( function(row) {
				if (params.query) {
					var text = [row.title, row.description, row.id, row.license, row.type, ...row.tags, ...row.requires].join(' ').toLowerCase();
					if (!text.includes(params.query.toLowerCase())) return false;
				}
				if (params.type && (row.type != params.type)) return false;
				if (params.plugin_type && (row.plugin_type != params.plugin_type)) return false;
				if (params.license && (row.license.toLowerCase() != params.license.toLowerCase())) return false;
				if (params.author && (crammify(row.author) != crammify(params.author))) return false;
				if (params.tags && !includesAllCrammified(row.tags, params.tags)) return false;
				if (params.requires && !includesAllCrammified(row.requires, params.requires)) return false;
				return true;
			} );
			
			// apply user sort
			Tools.sortBy( rows, params.sort_by || 'title', { dir: params.sort_dir || 1 } );
			
			// apply user offset/limit
			var len = rows.length;
			rows = rows.slice( params.offset || 0, (params.offset || 0) + (params.limit || 1000) );
			
			self.send_json_ttl_response({ code: 0, rows: rows, list: { length: len } }, callback);
		}; // finish
		
		// use cached marketplace metadata, or fetch from origin if stale
		fs.stat( cache_file, function(err, stats) {
			if (err || (stats.mtimeMs / 1000 < Tools.timeNow() - marketplace.ttl)) {
				// fetch from origin
				self.logDebug(5, "Fetching marketplace metadata from origin: " + marketplace.metadata_url);
				self.request.json( marketplace.metadata_url, false, { retries: 8, retryDelay: 50 }, function(err, resp, metadata, perf) {
					if (err) return self.doError('marketplace', "Failed to fetch marketplace metadata: " + marketplace.metadata_url + ": " + err, callback);
					
					Tools.writeFileAtomic( cache_file, JSON.stringify(metadata), function(err) {
						if (err) return self.doError('marketplace', "Failed to write cache file: " + cache_file + ": " + err, callback);
						finish(metadata);
					}); // writeFileAtomic
				} ); // request.json
				return;
			} // err or stale
			
			// use cached file
			fs.readFile( cache_file, 'utf8', function(err, contents) {
				if (err) return self.doError('marketplace', "Failed to read cache file: " + cache_file + ": " + err, callback);
				var metadata = null;
				
				try { metadata = JSON.parse(contents); }
				catch (err) { return self.doError('marketplace', "Failed to parse cache file: " + cache_file + ": " + err, callback); }
				
				finish(metadata);
			} ); // fs.readFile
		} ); // fs.stat
	},
	
	requireParams(params, rules, callback) {
		// validate params against set of regexp rules
		assert( arguments.length == 3, "Wrong number of arguments to requireParams" );
		
		for (var key in rules) {
			var rule = rules[key];
			if (typeof(params[key]) == 'undefined') {
				return this.doError('api', "Missing parameter: " + key, callback);
			}
			if (rule === 'array') {
				if (!Tools.isaArray(params[key])) {
					return this.doError('api', "Parameter is not an array: " + key, callback);
				}
			}
			else if (typeof(rule) == 'string') {
				if (typeof(params[key]) != rule) {
					return this.doError('api', "Parameter is not type " + rule + ": " + key, callback);
				}
			}
			else if (!(''+params[key]).match(rule)) {
				return this.doError('api', "Malformed parameter: " + key, callback);
			}
		}
		
		return true;
	},
	
	doError(code, msg, callback) {
		// log error and return standard API error response
		assert( arguments.length == 3, "Wrong number of arguments to doError" );
		this.logError( code, msg, data );
		callback({ code: code, description: (''+msg).replace(/<[^>]*>/g, '') });
		return false;
	},
	
	shutdown: function(callback) {
		callback();
	}
	
};
