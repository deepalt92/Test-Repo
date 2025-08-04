import './Skeleton.css';

export const Skeleton = ({ height, width }) => (
  <div 
    className="skeleton-pulse" 
    style={{ height, width }}
  />
);