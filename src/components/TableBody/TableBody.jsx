import React, { useState, useEffect,useRef  } from 'react';
import './TableBody.scss';
import Slideshow from '../SlideShow/SlideShow';
import * as math from 'mathjs';


const TableBody = (props) => {
  const [apiResponse, setApiResponse] = useState(null);
  const [slideshowImageUrls, setSlideshowImageUrls] = useState([]);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const inputRef = useRef(null);
  const inputRefCustom = useRef(null);

  const openSlideshow = (imageUrls) => {
    setSlideshowImageUrls(imageUrls);
    setIsSlideshowOpen(true);
  };

  const closeSlideshow = () => {
    setIsSlideshowOpen(false);
  };

  const supplierId = props.supplierId;

  const [apiProducts, setApiProducts] = useState([]);
  useEffect(() => {
    fetch('https://api.lanha.vn/api/v1/quote/products')
      .then((response) => response.json())
      .then((data) => {
        setApiProducts(data.data);
        setApiResponse(data);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (isSlideshowOpen) {
        if (e.target.closest('.slideshow-container')) {
        closeSlideshow();
      }
      }
      
    };
  
    document.addEventListener('click', handleDocumentClick);
  
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  

  const { Parser } = require('expr-eval');

  const calculateWeight = (product, length, width, height) => {
    if (product && product.formulaQuantity) {
      const processedFormula = product.formulaQuantity
        .replace(new RegExp("Cao", "g"), parseFloat(height))
        .replace(new RegExp("Rộng", "g"), parseFloat(width))
        .replace(new RegExp("Dài", "g"), parseFloat(length))
        .replace(new RegExp("Khối lượng", "g"), parseFloat(length));
      const weight = eval(processedFormula);
      return weight;
    } else {
      return 0; 
    }
  };
  

  const calculateUnit = (product, length, width, height) => {
    const formula = product.unit
      .replace(new RegExp("Dài", "g"), length)
      .replace(new RegExp("Rộng", "g"), width)
      .replace(new RegExp("Cao", "g"), height);
  
    const formulaWithValues = formula.replace(/\(([^)]+)\) \? "([^"]+)" : "([^"]+)"/, (_, condition, trueResult, falseResult) => {
      const evalCondition = eval(condition); 
      return evalCondition ? trueResult : falseResult;
    });
    try {
      return formulaWithValues;
    } catch (error) {
      return "Công thức không hợp lệ";
    }
  };

  const calculatePrice = (product, length, width, height, weight) => {
    if (product) {
      let formula = product;
      formula = formula.replace('Dài', length);
      formula = formula.replace('Rộng', width);
      formula = formula.replace('Cao', height);
      formula = formula.replace('Khối lượng', weight);
      const total = eval(formula);
      return total;
    } else {
      return 0;
    }
};

  
  const calculateTotal = (product, length, width, height, weight, price) => {
  if (product && product.formulaPrice) {
    const formula = product.formulaPrice
      .replace('Dài', length)
      .replace('Rộng', width)
      .replace('Cao', height)
      .replace('Khối lượng', parseFloat(weight))
      .replace('Đơn giá', price);
    const total = eval(formula);
    return total;
  } else {
    return 0; // Hoặc giá trị mặc định khác tùy thuộc vào logic của bạn
  }
};


  const [contextMenuIndex, setContextMenuIndex] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  const handleContextMenu = (e, index) => {
    e.preventDefault();
    setContextMenuIndex(index);
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
    setIsContextMenuOpen(true);
  };

  const deleteRow = () => {
    if (contextMenuIndex !== null) {
      const updatedTableData = [...tableData];
      updatedTableData.splice(contextMenuIndex, 1);
      setTableData(updatedTableData);
      setContextMenuIndex(null);
    }
  };

  const closeContextMenu = () => {
    setContextMenuIndex(null);
    setIsContextMenuOpen(false);
  };

  const [tableData, setTableData] = useState([
    {
      product: null,
      description: '',
      unit: '',
      weight: '',
      price: '',
      total: '',
      note: '',
      referenceImage: [],
      length: '',
      width: '',
      height: '',
    },
  ]);

  const [footerRows, setFooterRows] = useState([
    {
      title: 'TỔNG CỘNG',
      total: 0,
    }
  ]);

  useEffect(() => {
    if (apiProducts.length > 0 && tableData.length > 0) {
      const updatedTableData = [...tableData];
      updatedTableData.forEach((row) => {
        const selectedProduct = row.product;
        const length = parseFloat(row.length) || 0;
        const width = parseFloat(row.width) || 0;
        const height = parseFloat(row.height) || 0;
        let weight;
        if(selectedProduct){
          if(selectedProduct.formulaQuantity === ''){
            weight = row.weight || 0;
          }else{
            weight = calculateWeight(selectedProduct, length, width, height) || 0;
          }
          if(selectedProduct.price !=null && selectedProduct.price !=0 && selectedProduct.price != undefined){
            const priceVal = calculatePrice(selectedProduct.price,length,width,height,weight);
            row.price = priceVal;
          }else{
            const material = row.materialOptions.find((option) => option.value === row.description);
            if(material){
              if(material.materialList.material.price!=null && material.materialList.material.price!=0 && material.materialList.material.price!=undefined){
                const priceVal = calculatePrice(material.materialList.material.price,length,width,height,weight);
                row.price= priceVal
              }else{
                const supp = supplierId;
                if (supp) {
                    const price = material.materialList.price.find((price) => price.trademark === supp);
                    const priceVal = calculatePrice(price.priceValue,length,width,height,weight);
                    row.price = price ? priceVal : '';
                  } else {
                    row.price = '';
                  }
                }
            }
          }
        }

        const price = parseFloat(row.price) || 0;
        const total = calculateTotal(selectedProduct, length, width, height, weight, price);
        row.total = total;
        
      });

      setTableData(updatedTableData);
      calculateTotalPrice();
    }
  }, [supplierId, apiProducts, tableData]);
  

  const calculateTotalPrice = () => {
    let totalPrice = 0;
  
    tableData.forEach((row) => {
      const numericTotal = parseFloat(row.total) || 0;
      totalPrice += numericTotal;
    });
  
    customRows.forEach((row) => {
      const numericTotal = parseFloat(row.total) || 0;
      totalPrice += numericTotal;
    });
  
    setFooterRows((prevFooterRows) =>
      prevFooterRows.map((row, index) =>
        index === 0 ? { ...row, total: totalPrice.toString() } : row
      )
    );
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [tableData]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.table-row')) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const addRow = () => {
    setTableData([
      ...tableData,
      {
        product: null,
        description: '',
        unit: '',
        weight: '',
        price: '',
        total: '',
        note: '',
        referenceImage: '',
        length: '',
        width: '',
        height: '',
        isEditable: true,
      },
    ]);
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const [isDescriptionDropdownOpen, setDescriptionDropdownOpen] = useState(Array(tableData.length).fill(false));


  const updateSelectedMaterials = (productId) => {
    const product = apiProducts.find((product) => product._id === productId);

    if (product) {
      setSelectedMaterials(product.listMaterial);
    } else {
      setSelectedMaterials([]);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(tableData.map(() => false));
  const [selectedProducts, setSelectedProducts] = useState([]);

  const toggleDropdown = (index) => {
    const updatedIsDropdownOpen = [...isDropdownOpen];
    updatedIsDropdownOpen[index] = !updatedIsDropdownOpen[index];
    setIsDropdownOpen(updatedIsDropdownOpen);
  };

  const toggleDescriptionDropdown = (index) => {
    const updatedIsDescriptionDropdownOpen = [...isDescriptionDropdownOpen];
    updatedIsDescriptionDropdownOpen[index] = !updatedIsDescriptionDropdownOpen[index];
    setDescriptionDropdownOpen(updatedIsDescriptionDropdownOpen);
  };
  
  const calculateUnit2 = (product) => {
  
    if (product.unit.includes("Dài") || product.unit.includes("Rộng") || product.unit.includes("Cao")) {
      return null; 
    }else{
      return product.unit;
    }
  };

  const [isLengthColumnEnabled, setIsLengthColumnEnabled] = useState(Array(tableData.length).fill(false));
  const [isWidthColumnEnabled, setIsWidthColumnEnabled] = useState(Array(tableData.width).fill(false));
  const [isHeightColumnEnabled, setIsHeightColumnEnabled] = useState(Array(tableData.height).fill(false));
  const [isWeightColumnEnabled, setIsWeightColumnEnabled] = useState(Array(tableData.weight).fill(false));

  const handleProductChange = (index, selectedProduct) => {
    if (selectedProduct) {
      const updatedTableData = [...tableData];
      updatedTableData[index].product = selectedProduct;


      if (selectedProduct.price) {
        updatedTableData[index].price = selectedProduct.price;
      } else {
        updatedTableData[index].price = '';
      }
      

      const updatedSelectedProducts = [...selectedProducts];
      updatedSelectedProducts[index] = selectedProduct;
      setSelectedProducts(updatedSelectedProducts);

      const selectedDescription = selectedProduct.description || 'Chọn mô tả';
      updatedTableData[index].description = selectedDescription;
      updatedTableData[index].selectedDescription = '';
      const unit = calculateUnit2(selectedProduct);
      updatedTableData[index].unit = unit;
      //updatedTableData[index].unit = selectedProduct.unit || '';
      updatedTableData[index].note = selectedProduct.note || '';
      updatedTableData[index].referenceImage = selectedProduct.listMaterial.imgUrl || '';
      updatedTableData[index].weight = '';
      updatedTableData[index].total = '';
      updatedTableData[index].length = selectedProduct.size.width || '';
      updatedTableData[index].width = selectedProduct.size.depth || '';
      updatedTableData[index].height = selectedProduct.size.height || '';
      updatedTableData[index].referenceImage = selectedProduct.imgUrl || '';

      updatedTableData[index].materialOptions = selectedProduct.listMaterial.map((material) => ({
        value: material.material.description,
        label: material.material.description,
        materialList: material,
        imgUrl: material.material.imgUrl,
      }));
      if(selectedProduct.size.width==null){
        const updatedLengthColumnEnabled = [...isLengthColumnEnabled];
        updatedLengthColumnEnabled[index] = true;
        setIsLengthColumnEnabled(updatedLengthColumnEnabled);
      }else{
        const updatedLengthColumnEnabled = [...isLengthColumnEnabled];
        updatedLengthColumnEnabled[index] = false;
        setIsLengthColumnEnabled(updatedLengthColumnEnabled);
      }
      if(selectedProduct.size.depth==null){
        const updatedWidthColumnEnabled = [...isWidthColumnEnabled];
        updatedWidthColumnEnabled[index] = true;
        setIsWidthColumnEnabled(updatedWidthColumnEnabled);
      }else{
        const updatedWidthColumnEnabled = [...isWidthColumnEnabled];
        updatedWidthColumnEnabled[index] = false;
        setIsWidthColumnEnabled(updatedWidthColumnEnabled);
      }
      if(selectedProduct.size.height==null){
        const updatedHeightColumnEnabled = [...isHeightColumnEnabled];
        updatedHeightColumnEnabled[index] = true;
        setIsHeightColumnEnabled(updatedHeightColumnEnabled);
      }else{
        const updatedHeightColumnEnabled = [...isHeightColumnEnabled];
        updatedHeightColumnEnabled[index] = false;
        setIsHeightColumnEnabled(updatedHeightColumnEnabled);
      }
      if(selectedProduct.formulaQuantity==''){
        const updatedWeightColumnEnabled = [...isWeightColumnEnabled];
        updatedWeightColumnEnabled[index] = true;
        setIsWeightColumnEnabled(updatedWeightColumnEnabled);
      }else{
        const updatedWeightColumnEnabled = [...isWeightColumnEnabled];
        updatedWeightColumnEnabled[index] = false;
        setIsWeightColumnEnabled(updatedWeightColumnEnabled);
      }

      setTableData(updatedTableData);
    }
  };

  const handleDescriptionChange = (index, selectedValue) => {
    const updatedTableData = [...tableData];
    updatedTableData[index].selectedDescription = selectedValue;

    updatedTableData[index].description = selectedValue;
    const selectedProduct = updatedTableData[index].product;

    const matchedMaterial = selectedProduct.listMaterial.find(
      (material) => material.material.description === selectedValue
    );
    
    if (matchedMaterial) {
      const imgUrls = matchedMaterial.material.imgUrl;
      updatedTableData[index].referenceImage = imgUrls;
    } else {
    }
    if (selectedValue && matchedMaterial.material && matchedMaterial.material.price!=0) {
      //updatedTableData[index].price = calculatePrice(matchedMaterial.material.price);
      updatedTableData[index].price = matchedMaterial.material.price;
      updatedTableData[index].note = matchedMaterial.material.note;
  } else {
      const supp = supplierId;

      if (supp) {
        const material = selectedValue.materialList;

        if (material) {
          const price = material.price.find((price) => price.trademark === supp);
          updatedTableData[index].price = price ? price.priceValue : '';
        } else {
          updatedTableData[index].price = '';
        }
      }
    }
    const updatedIsDescriptionDropdownOpen = [...isDescriptionDropdownOpen];
    updatedIsDescriptionDropdownOpen[index] = false;
    setDescriptionDropdownOpen(updatedIsDescriptionDropdownOpen);

    setTableData(updatedTableData);
  };

  const handleInputChange = (index, field, value) => {
    const updatedTableData = [...tableData];
    updatedTableData[index][field] = value;
    const product = updatedTableData[index].product;
    
    

    const length = updatedTableData[index].length || 0;
    const width = updatedTableData[index].width || 0;
    const height = updatedTableData[index].height || 0;
    if(updatedTableData[index].unit !='Cái'){
      const weight = calculateWeight(product, length, width, height);
      updatedTableData[index].weight = weight;
      const price = parseFloat(updatedTableData[index].price) || 0;
      const total = calculateTotal(product, length, width, height, weight, price);
      updatedTableData[index].total = total.toString();

    }else{
      const weight = updatedTableData[index].weight || 0;
      updatedTableData[index].weight = weight;
      const price = parseFloat(updatedTableData[index].price) || 0;
      const total = calculateTotal(product, length, width, height, weight, price);
      updatedTableData[index].total = total;
    }
    const unit = calculateUnit(product, length, width, height);
    updatedTableData[index].unit = unit
    setTableData(updatedTableData);
  };

  const handleInputChangeCustom = (index, field, value) => {
    // Tạo một bản sao của trạng thái hiện tại
    const updatedTableDataCustom = [...customRows];

    // Cập nhật giá trị trong ô tương ứng
    updatedTableDataCustom[index][field] = value;
    if (field === 'price' || field === 'weight') {
      const price = parseFloat(updatedTableDataCustom[index].price) || 0;
      const weight = parseFloat(updatedTableDataCustom[index].weight) || 0;
      const total = price * weight;
  
      updatedTableDataCustom[index].total = total;
    }

    // Cập nhật trạng thái với dữ liệu đã thay đổi
    setCustomRows(updatedTableDataCustom);
  };

  function addImage() {
    // Xử lý logic khi người dùng chọn thêm ảnh
    // Ví dụ: Hiển thị hộp thoại chọn ảnh hoặc thực hiện các thao tác tương ứng
  }

  function deleteImagesInRow(index) {
    const updatedTableData = [...tableData];
    updatedTableData[index].referenceImage = [];
    setTableData(updatedTableData);
  }
  
  function deleteImage(index) {
    if (index !== null) {
      deleteImagesInRow(index);
    }
  }

  function deleteImagesInRowCustom(index) {
    const updatedTableData = [...customRows];
    updatedTableData[index].referenceImage = [];
    setCustomRows(updatedTableData);
  }
  
  function deleteImageCustom(index) {
    if (index !== null) {
      deleteImagesInRowCustom(index);
    }
  }
  
  const [imageRowIndex, setImageRowIndex] = useState(null);
const [imageRowIndexCustom, setImageRowIndexCustom] = useState(null);

const addImageToRow = (index) => {
  setImageRowIndex(index);
  console.log("123 ",index);
  inputRef.current.click();
};

const addImageToRowCustom = (index) => {
  setImageRowIndexCustom(index);
  console.log("456  ",index);
  inputRefCustom.current.click();
};

const handleImageSelection = (index, selectedFiles) => {
  console.log("HHHHHHHHHHHHHHHHH")

  const updatedTableData = [...tableData];
  const referenceImage = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const imageURL = URL.createObjectURL(file);
    referenceImage.push(imageURL);
  }

  updatedTableData[index].referenceImage = referenceImage;
  setTableData(updatedTableData);
};

const handleImageSelectionCustom = (index, selectedFiles) => {
  console.log("KKKKKKKKKKKKKK")

  const updatedCustomRows = [...customRows];
  const referenceImageCustom = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const imageURL = URL.createObjectURL(file);
    referenceImageCustom.push(imageURL);
  }

  updatedCustomRows[index].referenceImage = referenceImageCustom;
  setCustomRows(updatedCustomRows);
};

  
  
  const [customRows, setCustomRows] = useState([
    // Dữ liệu hàng kiểu mới (tất cả ô đều là kiểu input text)
    // {
    //   product: '',
    //   description: '',
    //   unit: '',
    //   weight: '',
    //   price: '',
    //   total: '',
    //   note: '',
    //   referenceImage: [],
    //   length: '',
    //   width: '',
    //   height: '',
    // },
  ]);
  const addCustomRow = () => {
    const newRow = {
      product: '',
      description: '',
      unit: '',
      weight: '',
      price: '',
      total: '',
      note: '',
      referenceImage: [],
      length: '',
      width: '',
      height: '',
    };

    // Thêm hàng mới kiểu mới vào trạng thái dữ liệu bảng
    setCustomRows([...customRows, newRow]);
  };
  useEffect(() => {
    const handleResize = () => {
      const textArea = document.getElementById('myTextarea');
      if (textArea) {
        textArea.style.height = 'auto'; // Đặt lại độ cao thành 'auto' trước khi tính toán lại
        textArea.style.height = textArea.scrollHeight + 'px'; // Cập nhật độ cao dựa trên scrollHeight
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <table className="table-body">
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} onContextMenu={(e) => handleContextMenu(e, index)} onClick={closeContextMenu} className="table-row">
            <td className="table-cell product">
            <div className={`custom-select ${isDropdownOpen[index] ? 'active' : ''}`} onClick={() => toggleDropdown(index)} >
                  <div className="selected-option noprint-border" >{selectedProducts[index] && selectedProducts[index].name ? selectedProducts[index].name : 'Chọn sản phẩm'}</div>
                  <div className="dropdown-arrow toggle-icon">{isDropdownOpen[index] ? '▲' : '▼'}</div>
                  {isDropdownOpen[index] && (
                    <div className="options">
                      {apiProducts.map((product) => (
                        <div key={product._id} className="option" onClick={() => handleProductChange(index, product)}>
                          {product.name}
                        </div>
                    ))}
                  </div>
                )}
              </div>
              </td>
              <td className="table-cell description ">
              <div
                  className={`custom-select ${isDescriptionDropdownOpen[index] ? 'active' : ''}`}
                  onClick={() => toggleDescriptionDropdown(index)}
                >
                <div className="selected-option noprint-border">
                  {row.selectedDescription ? row.selectedDescription : '-- Chọn mô tả --'}
                </div>
                <div className="dropdown-arrow toggle-icon">
                  {isDescriptionDropdownOpen[index] ? '▲' : '▼'}
                </div>
                {isDescriptionDropdownOpen[index] && row.materialOptions && row.materialOptions.length > 0 &&(
                  <div className="options">
                    {row.materialOptions.map((option) => (
                      <div
                        key={option.value}
                        className="option"
                        onClick={() => handleDescriptionChange(index, option.value, option.imgUrl)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </td>
              <td className="table-cell size-item">
                <input
                  type="number"
                  value={row.length}
                  onChange={(e) => handleInputChange(index, 'length', e.target.value)}
                  disabled={!isLengthColumnEnabled[index]}
                  style={isLengthColumnEnabled[index] ? {  border: '1px solid #C0C0C0' } : {border: 'none'}}
                  className='noprint-border'
                />
              </td>
              <td className="table-cell size-item">
                <input
                  type="number"
                  value={row.width}
                  onChange={(e) => handleInputChange(index, 'width', e.target.value)}
                  disabled={!isWidthColumnEnabled[index]}
                  style={isWidthColumnEnabled[index] ? { border: '1px solid #C0C0C0' } : {border: 'none'}}
                  className='noprint-border'
                />
              </td>
              <td className="table-cell size-item">
                <input
                  type="number"
                  value={row.height}
                  onChange={(e) => handleInputChange(index, 'height', e.target.value)}
                  style={isHeightColumnEnabled[index] ? { border: '1px solid #C0C0C0' } : {border: 'none'}}
                  className='noprint-border'
                  disabled={!isHeightColumnEnabled[index]}
                />
              </td>
              <td className="table-cell unit">{row.unit}</td>
              <td className="table-cell size-item weight"><input
                  type="number"
                  value={row.weight}
                  onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                  disabled={!isWeightColumnEnabled[index]}
                  style={isWeightColumnEnabled[index] ? { border: '1px solid #C0C0C0' } : {border: 'none'}}
                  className='noprint-border'
                /></td>
              <td className="table-cell price">{Number(row.price).toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND'
              })}</td>
              <td className="table-cell total">
              {Number(row.total).toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND'
              })}
            </td>
              <td className="table-cell note">{row.note}</td>
              <td className="table-cell reference-image">
              <div className="image-container">
                {Array.isArray(row.referenceImage) && row.referenceImage.length > 0 ? (
                  <div className="reference-image-tooltip">
                    {row.referenceImage.slice(0, 1).map((imgUrl, imgIndex) => (
                      <img
                        key={imgIndex}
                        className="reference-image-item"
                        style={{ width: "50%" }}
                        // src={`https://lanha-bucket.s3.ap-southeast-1.amazonaws.com/uploads/images/icons/${imgUrl}`}
                        src={imgUrl.startsWith("ICON_QUOTE") ? `https://lanha-bucket.s3.ap-southeast-1.amazonaws.com/uploads/images/icons/${imgUrl}` : imgUrl}
                        alt={`Ảnh mô tả ${imgIndex + 1}`}
                        onClick={() => openSlideshow(row.referenceImage)}
                      />
                    ))}
                    <span className="tooltip-text">Nhấn để xem thêm hình ảnh khác</span>
                    <div className='multy-picture toggle-icon'>. . .</div>
                    <div class="menu-icon">
                      <i class="fas fa-bars" id="menu-trigger"></i>
                      <div class="options-menu" id="options-menu">
                        <div class="option" onClick={() => inputRef.current.click()}>Thêm ảnh</div>
                        <div class="option" onClick={() => deleteImage(index)}>Xóa ảnh</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="button-add-image" onClick={() => addImageToRow(index)}>Thêm ảnh</button>
                )}
                <input
                type="file"
                id="file-input"
                ref={inputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleImageSelection(imageRowIndex, e.target.files)}
              />
              </div>
              
            </td>

            </tr>
          ))}
          {customRows.map((row, index) => (
            // Hiển thị hàng kiểu mới (tất cả ô đều là input text)
            <tr key={index + 100}>
              <td className="table-cell product">
            <textarea
              value={row.product}
              spellCheck={false}
              onChange={(e) => {
                handleInputChangeCustom(index, 'product', e.target.value);

                if (e.target.value === '') {
                  e.target.style.height = 'auto';
                } else {
                  const valueLength = e.target.value.length;
                  let extraHeight = 0;
                  if (valueLength > 80) {
                    extraHeight = 40;
                  } else if (valueLength > 60) {
                    extraHeight = 30;
                  } else if (valueLength > 40) {
                    extraHeight = 20;
                  } else if (valueLength > 20) {
                    extraHeight = 10;
                  }
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight + extraHeight, 300) + 'px'; // Giới hạn độ cao tối đa
                }
              }}
              style={{
                overflowWrap: 'break-word',
              }}
              rows={row.description.split('\n').length}
            />
          </td>
            <td className="table-cell description">
            <textarea
              value={row.description}
              spellCheck={false}
              onChange={(e) => {
                handleInputChangeCustom(index, 'description', e.target.value);

                if (e.target.value === '') {
                  e.target.style.height = 'auto';
                } else {
                  const valueLength = e.target.value.length;
                  let extraHeight = 0;
                  if (valueLength > 80) {
                    extraHeight = 40;
                  } else if (valueLength > 60) {
                    extraHeight = 30;
                  } else if (valueLength > 40) {
                    extraHeight = 20;
                  } else if (valueLength > 20) {
                    extraHeight = 10;
                  }
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight + extraHeight, 300) + 'px'; // Giới hạn độ cao tối đa
                }
              }}
              style={{
                overflowWrap: 'break-word',
              }}
              rows={row.description.split('\n').length}
            />
          </td>
              <td className="table-cell size-item">
                <input
                  type="text"
                  value={row.length}
                  onChange={(e) => handleInputChangeCustom(index, 'length', e.target.value)}
                />
              </td>
              <td className="table-cell size-item">
                <input
                  type="text"
                  value={row.width}
                  onChange={(e) => handleInputChangeCustom(index, 'width', e.target.value)}
                />
              </td>
              <td className="table-cell size-item">
                <input
                  type="text"
                  value={row.height}
                  onChange={(e) => handleInputChangeCustom(index, 'height', e.target.value)}
                />
              </td>
              <td className="table-cell unit">
                <input
                  type="text"
                  value={row.unit}
                  onChange={(e) => handleInputChangeCustom(index, 'unit', e.target.value)}
                />
              </td>
              <td className="table-cell weight">
                <input
                  type="text"
                  value={row.weight}
                  onChange={(e) => handleInputChangeCustom(index, 'weight', e.target.value)}
                />
              </td>
              <td className="table-cell price">
                <input
                  type="text"
                  value={row.price}
                  onChange={(e) => handleInputChangeCustom(index, 'price', e.target.value)}
                />
              </td>
              <td className="table-cell total">
              {Number(row.total).toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND'
              })}
            </td>
            <td className="table-cell note">
            <textarea
              value={row.note}
              spellCheck={false}
              onChange={(e) => {
                handleInputChangeCustom(index, 'note', e.target.value);

                if (e.target.value === '') {
                  e.target.style.height = 'auto';
                } else {
                  const valueLength = e.target.value.length;
                  let extraHeight = 0;
                  if (valueLength > 80) {
                    extraHeight = 40;
                  } else if (valueLength > 60) {
                    extraHeight = 30;
                  } else if (valueLength > 40) {
                    extraHeight = 20;
                  } else if (valueLength > 20) {
                    extraHeight = 10;
                  }
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight + extraHeight, 300) + 'px'; // Giới hạn độ cao tối đa
                }
              }}
              style={{
                overflowWrap: 'break-word',
              }}
              rows={row.description.split('\n').length}
            />
          </td>
              <td className="table-cell reference-image">
              <div className="image-container">
                {Array.isArray(row.referenceImage) && row.referenceImage.length > 0 ? (
                  <div className="reference-image-tooltip">
                    {row.referenceImage.slice(0, 1).map((imgUrl, imgIndex) => (
                      <img
                        key={imgIndex}
                        className="reference-image-item"
                        style={{ width: "50%" }}
                        // src={`https://lanha-bucket.s3.ap-southeast-1.amazonaws.com/uploads/images/icons/${imgUrl}`}
                        src={imgUrl.startsWith("ICON_QUOTE") ? `https://lanha-bucket.s3.ap-southeast-1.amazonaws.com/uploads/images/icons/${imgUrl}` : imgUrl}
                        alt={`Ảnh mô tả ${imgIndex + 1}`}
                        onClick={() => openSlideshow(row.referenceImage)}
                      />
                    ))}
                    <span className="tooltip-text">Nhấn để xem thêm hình ảnh khác</span>
                    <div className='multy-picture toggle-icon'>. . .</div>
                    <div class="menu-icon">
                      <i class="fas fa-bars" id="menu-trigger"></i>
                      <div class="options-menu" id="options-menu">
                        <div class="option" onClick={() => inputRefCustom.current.click()}>Thêm ảnh</div>
                        <div class="option" onClick={() => deleteImageCustom(index)}>Xóa ảnh</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="button-add-image" onClick={() => addImageToRowCustom(index)}>Thêm ảnh</button>
                )}
              </div>
              <input
                type="file"
                id="file-input"
                ref={inputRefCustom}
                style={{ display: 'none' }}
                onChange={(e) => handleImageSelectionCustom(imageRowIndexCustom, e.target.files)}
              />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="add-row-button toggle-icon">
        <i className="fas fa-plus "></i>
      </button>
      <button onClick={addCustomRow} className="add-row2-button toggle-icon">
        <i className="fas fa-plus "></i>
      </button>
      {contextMenuIndex !== null && (
        <div className="context-menu" style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}>
          <div onClick={deleteRow}>Xóa hàng này</div>
        </div>
      )}
      <table className="table-footer">
        <tbody>
          {footerRows.map((row, index) => (
            <tr key={index}>
              <td className="footer-title">{row.title}</td>
              <td className="footer-total">{Number(row.total).toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND'
              })}</td>
              <td className="footer-note"></td>
              <td className="footer-totdescriptional"></td>
            </tr>
          ))}
        </tbody>
      </table>
      {isSlideshowOpen && (
  <div className="slideshow-overlay">
    <Slideshow imageUrls={slideshowImageUrls} onClose={closeSlideshow} />
  </div>
)}

    </div>
  );
};

export default TableBody;
