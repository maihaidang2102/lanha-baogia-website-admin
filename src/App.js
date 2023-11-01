import React, { useRef,useState  } from 'react';
import QuotationForm from './components/QuotationForm/QuotationForm';
import generatePDF, { Resolution, Margin, Options } from 'react-to-pdf';
import './App.css';

const options: Options = {
  filename: `lanha-baogia-${new Date().toLocaleDateString()}.pdf`,
  method: 'save',
  resolution: Resolution.HIGH,
  page: {
    margin: Margin.NONE,
    format: 'a4',
    orientation: 'landscape',
    pageBreakBefore: true,
  },
};

function App() {
  const pdfRef = useRef(null);
  const [isFormValid, setIsFormValid] = useState(false);
  var printOptions = {
    pages: 'all',             // In tất cả các trang
    layout: 'landscape',      // Chiều ngang
    background: true,         // Bao gồm đồ họa nền
    color: true,              // Màu sắc
    paperSize: 'A4',      // Kích thước giấy letter
    pagesPerSheet: 1,         // 1 trang trên mỗi tờ giấy
    marginsType: 1,           // Mặc định
    scale: 1                  // Mặc định
};

function printPage() {
  if (isFormValid) {
    window.print(printOptions); 
  } else {
    alert("Vui lòng điền đầy đủ thông tin trước khi xuất PDF.");
  }
  
}



  const openPDF = (element) => {
    if (isFormValid) {
      generatePDF(() => pdfRef.current, options);
    } else {
      alert("Vui lòng điền đầy đủ thông tin trước khi xuất PDF.");
    }
  };

  return (
    <div className="App">
      <div ref={pdfRef} className="page">
      <style>
        {`
          @page {
            size: A4 landscape;
          }
        `}
      </style>
      <QuotationForm onFormValidationChange={setIsFormValid} />
      </div>
      <button 
        onClick={printPage}
        className="no-print"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1,
          background: '#ff9c04', 
          color: 'white',        
          borderRadius: '50%',     
          padding: '10px 20px',    
          border: 'none',         
          cursor: 'pointer', 
        }}
      >
        Xuất PDF
      </button>
    </div>
  );
}

export default App;
