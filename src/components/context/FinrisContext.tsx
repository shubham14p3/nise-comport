import { createContext } from 'react';
import type { contextType } from '../../types/context';

const FinrisContext = createContext<contextType | null>(null);
export default FinrisContext;