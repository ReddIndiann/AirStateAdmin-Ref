const LoadingSpinner = ({
  borderColor = '#AE1729',
  width = '20px',
  height = '20px'
}) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div 
        className="border-4 border-t-transparent rounded-full animate-spin"
        style={{ 
          borderColor: `${borderColor} transparent ${borderColor} ${borderColor}`,
          width,
          height
        }}
      >
      </div>
    </div>
  );
};

export default LoadingSpinner;