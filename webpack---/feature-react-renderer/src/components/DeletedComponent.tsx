import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import React, { FC } from 'react'
import { IRendererPropsExtender } from '@wix/thunderbolt-symbols'
import { ComponentWrapperSymbol, IWrapComponent } from '@wix/thunderbolt-components-loader'

interface IProps {
	BaseComponent: FC<any>
}

const DeletedComponent = ({ BaseComponent }: IProps) => {
	return (
		<BaseComponent
			style={{
				visibility: 'hidden',
				overflow: 'hidden',
				pointerEvents: 'none',
			}}
		/>
	)
}

export const DeletedCompPropsProvider = withDependencies(
	[optional(ComponentWrapperSymbol)],
	(componentWrapper?: IWrapComponent): IRendererPropsExtender => {
		return {
			async extendRendererProps() {
				const wrapComponent = componentWrapper?.wrapComponent || (React.memo as IWrapComponent['wrapComponent'])
				return {
					DeletedComponent: wrapComponent(DeletedComponent as FC<any>),
				}
			},
		}
	}
)
