import type {Metadata} from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Búsqueda',
  robots: {
    index: false,
    follow: true,
  },
};

export default Home;
