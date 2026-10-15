// components/common/Card.jsx

const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-vgswhite rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
