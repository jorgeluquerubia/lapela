/** @jest-environment node */
import { admin } from '@/models/marketplace';
import { relevantCatalog } from '../search';

jest.mock('@/models/marketplace', () => ({ admin: jest.fn(), card: jest.fn() }));

const rpc = jest.fn().mockResolvedValue({ data: [], error: null });

beforeEach(() => {
  rpc.mockClear();
  (admin as jest.Mock).mockReturnValue({ rpc });
});

test.each([
  ['', null, null],
  ['&minPrice=&maxPrice=%20', null, null],
  ['&minPrice=10.50&maxPrice=25', 1050, 2500],
  ['&maxPrice=0', null, 0],
])('search passes the expected price limits for %s', async (query, minimum, maximum) => {
  const response = await relevantCatalog(new Request(`http://localhost/api/products?q=bicicleta${query}`));

  expect(response.status).toBe(200);
  expect(rpc).toHaveBeenCalledWith('lp_search_listings', expect.objectContaining({
    p_min_price_cents: minimum,
    p_max_price_cents: maximum,
  }));
});
