import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	IAppDidMountHandler,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { isSSR } from '@wix/thunderbolt-commons'
import { OnLinkClickSymbol } from './symbols'
import { IOnLinkClickHandler } from './types'
import React from 'react'

const clickHandlerRegistrarFactory = (
	browserWindow: NonNullable<BrowserWindow>,
	{ onLinkClick }: IOnLinkClickHandler,
	viewerModel: ViewerModel
): IAppDidMountHandler => {
	return {
		appDidMount: () => {
			if (isSSR(browserWindow)) {
				return
			}
			browserWindow.addEventListener('click', onLinkClick)
			if (viewerModel.mode.debug && React.version.startsWith('18')) {
				// for some reason react 18 strict mode doesn't fire click events on window
				Array.from(document.querySelectorAll?.('a') || []).map((e) => e.addEventListener('click', onLinkClick))
			}

			return () => {
				browserWindow.removeEventListener('click', onLinkClick)
			}
		},
	}
}

export const ClickHandlerRegistrar = withDependencies(
	[BrowserWindowSymbol, OnLinkClickSymbol, ViewerModelSym],
	clickHandlerRegistrarFactory
)
