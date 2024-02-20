import React from 'react'
import { RendererProps } from '../types'

const Context = React.createContext<RendererProps>({} as RendererProps)

export default Context
