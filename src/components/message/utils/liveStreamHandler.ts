
export const createSyntheticFileEvent = (
  videoFile: File,
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => {
  // Create a proper file input element and trigger change event
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  
  // Create a DataTransfer object to simulate file selection
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(videoFile);
  fileInput.files = dataTransfer.files;
  
  // Create the change event with proper typing
  const changeEvent = {
    target: fileInput,
    currentTarget: fileInput,
    nativeEvent: new Event('change', { bubbles: true }),
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    persist: () => {},
    preventDefault: () => {},
    stopPropagation: () => {},
    type: 'change',
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    timeStamp: Date.now()
  } as React.ChangeEvent<HTMLInputElement>;
  
  onFileChange(changeEvent);
};
