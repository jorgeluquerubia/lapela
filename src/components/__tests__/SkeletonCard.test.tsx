import { render, screen } from '@testing-library/react';
import SkeletonCard from '../SkeletonCard';

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    // We can check for the presence of the main container div
    const mainDiv = container.querySelector('.animate-pulse');
    expect(mainDiv).toBeInTheDocument();
  });
});
