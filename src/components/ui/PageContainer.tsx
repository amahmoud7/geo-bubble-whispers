import React from 'react';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageContainer: React.FC<PageContainerProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={[
        'min-h-screen bg-gradient-to-br from-gray-50 to-white',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;



