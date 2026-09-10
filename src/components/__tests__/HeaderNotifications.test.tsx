import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import Header from '../Header';
import {useAuth} from '@/context/AuthContext';

jest.mock('@/context/AuthContext',()=>({useAuth:jest.fn()}));
jest.mock('next/link',()=>({__esModule:true,default:({children,href,onClick,className}:any)=><a href={href} onClick={onClick} className={className}>{children}</a>}));
jest.mock('next/navigation',()=>({useRouter:()=>({push:jest.fn()})}));

describe('Header notifications',()=>{
  beforeEach(()=>{
    (useAuth as jest.Mock).mockReturnValue({user:{id:'user-1'},loading:false});
    global.fetch=jest.fn().mockResolvedValue({json:()=>Promise.resolve({
      unreadCount:2,
      notifications:[{
        id:'note-1',listing_id:'123e4567-e89b-12d3-a456-426614174000',order_id:'order-1',type:'new_message',title:'Nuevo mensaje',body:'¿Sigue disponible?',listing:{title:'Cámara de prueba'}
      }]
    })});
  });

  it('shows the bell, article link and contextual chat action',async()=>{
    render(<Header/>);
    const bell=await screen.findByRole('button',{name:'2 novedades sin leer'});
    fireEvent.click(bell);
    await waitFor(()=>expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument());
    expect(screen.getByRole('link',{name:/nuevo mensaje.*cámara de prueba/i})).toHaveAttribute('href','/articulos/camara-de-prueba-123e4567-e89b-12d3-a456-426614174000');
    expect(screen.getByRole('link',{name:'Abrir chat'})).toHaveAttribute('href','/orders/order-1');
    fireEvent.keyDown(window,{key:'Escape'});
    expect(screen.queryByText('¿Sigue disponible?')).not.toBeInTheDocument();
  });

  it('keeps the unread notification visible when article metadata is unavailable',async()=>{
    global.fetch=jest.fn().mockResolvedValue({json:()=>Promise.resolve({
      unreadCount:1,
      notifications:[{id:'note-without-listing',listing_id:'123e4567-e89b-12d3-a456-426614174000',type:'new_message',title:'Nuevo mensaje'}]
    })});
    render(<Header/>);
    fireEvent.click(await screen.findByRole('button',{name:'1 novedades sin leer'}));
    expect(await screen.findByText('Nuevo mensaje')).toBeInTheDocument();
    expect(screen.getAllByRole('link',{name:'Ver artículo'})[0]).toHaveAttribute('href','/articulos/articulo-123e4567-e89b-12d3-a456-426614174000');
  });
});
