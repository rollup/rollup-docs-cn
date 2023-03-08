import alias from '@rollup/plugin-alias';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { moduleAliases } from '../../build-plugins/aliases';
import { resolutions } from '../../build-plugins/replace-browser-modules';
import '../declarations.d';
import { examplesPlugin } from './create-examples';
import { transposeTables } from './transpose-tables';
import { buildEnd, callback, transformPageData } from './verify-anchors';

export default withMermaid(
	defineConfig({
		buildEnd,
		description: '编译 JS 代码',
		head: [
			['link', { href: '/favicon.png', rel: 'icon', type: 'image/png' }],
			['link', { href: '/favicon.png', rel: 'apple-touch-icon', sizes: '128x128' }],
			['link', { href: '/manifest.json', rel: 'manifest' }],
			['meta', { content: '#333333', name: 'theme-color' }],
			['meta', { content: 'yes', name: 'mobile-web-app-capable' }],
			['meta', { content: 'default', name: 'apple-mobile-web-app-status-bar-style' }],
			['meta', { content: 'summary_large_image', name: 'twitter:card' }],
			['meta', { content: '@rollupjs', name: 'twitter:site' }],
			['meta', { content: '@rollupjs', name: 'twitter:creator' }],
			['meta', { content: 'Rollup', name: 'twitter:title' }],
			['meta', { content: 'The JavaScript module bundler', name: 'twitter:description' }],
			['meta', { content: 'https://rollupjs.org/twitter-card.jpg', name: 'twitter:image' }]
		],
		markdown: {
			anchor: {
				callback,
				level: 2
			},
			config(md) {
				transposeTables(md);
			},
			linkify: false,
			toc: {
				level: [2, 3, 4]
			}
		},
		themeConfig: {
			algolia: {
				apiKey: '1ad354aec09a57f18f8d9bec8a913e52',
				appId: 'EMNHQTRZYG',
				indexName: 'rollup_docs_CN'
			},
			editLink: {
				pattern: 'https://github.com/rollup/rollup/edit/master/docs/:path',
				text: 'Edit this page on GitHub'
			},
			footer: {
				copyright: 'Copyright © 2015-present Rollup 社区贡献者',
				message: '基于 MIT 协议发布'
			},
			logo: '/rollup-logo.svg',
			nav: [
				{ link: '/introduction/', text: '指南' },
				{ link: '/repl/', text: 'repl' },
				{ link: 'https://is.gd/rollup_chat', text: '聊天' },
				{ link: 'https://opencollective.com/rollup', text: 'opencollective' }
			],
			outline: 'deep',
			sidebar: [
				{
					items: [
						{
							link: '/introduction/',
							text: '简介'
						},
						{
							link: '/command-line-interface/',
							text: '命令行接口'
						},
						{
							link: '/javascript-api/',
							text: 'Javascript API'
						}
					],
					text: '起步'
				},
				{
					items: [
						{
							link: '/tutorial/',
							text: '教程'
						},
						{
							link: '/es-module-syntax/',
							text: 'ES 模块语法'
						},
						{
							link: '/faqs/',
							text: '常见问题'
						},
						{
							link: '/troubleshooting/',
							text: '故障排除'
						},
						{
							link: '/migration/',
							text: '迁移到 Rollup 3'
						},
						{
							link: '/tools/',
							text: '其它工具'
						}
					],
					text: '更多信息'
				},
				{
					items: [
						{
							link: '/configuration-options/',
							text: '配置选项'
						},
						{
							link: '/plugin-development/',
							text: '插件开发'
						}
					],
					text: 'API'
				}
			],
			socialLinks: [
				{ icon: 'github', link: 'https://github.com/rollup/rollup' },
				{ icon: 'mastodon', link: 'https://m.webtoo.ls/@rollupjs' }
			]
		},
		title: 'Rollup 中文文档',
		transformPageData,
		vite: {
			optimizeDeps: { include: ['moment-mini', '@braintree/sanitize-url'] },
			plugins: [
				{
					apply: 'serve',
					enforce: 'pre',
					name: 'replace-browser-modules',
					resolveId(source, importer) {
						if (importer && source.startsWith('/@fs')) {
							return resolutions.get(source.slice(4));
						}
					},
					transformIndexHtml(html) {
						// Unfortunately, picomatch sneaks as a dedendency into the dev bundle.
						// This fixes an error.
						return html.replace('</head>', '<script>window.process={}</script></head>');
					}
				},
				{
					apply: 'build',
					enforce: 'pre',
					name: 'replace-local-rollup',
					resolveId(source) {
						if (source.includes('/browser-entry')) {
							return false;
						}
					}
				},
				examplesPlugin(),
				alias(moduleAliases)
			]
		}
	})
);
