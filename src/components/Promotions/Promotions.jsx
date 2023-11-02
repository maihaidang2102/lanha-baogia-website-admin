import { useState } from 'react';
import React from 'react';
import './Promotions.scss';

const PromotionTable = () => {
  const [data, setData] = useState([
    { input1: '', input2: '', input3: '' }
  ]);

  const handleAddRow = () => {
    setData([...data, { input1: '', input2: '', input3: '' }]);
  };

  const handleInputChange = (index, column, value) => {
    const updatedData = [...data];
    updatedData[index][column] = value;
    setData(updatedData);
  };
  return (
    <div className="promotion-table">
      <div className="main-table">
        <table>
          <thead>
            <tr>
              <th colSpan="4">PHƯƠNG THỨC THANH TOÁN</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    className="text-input"
                    value={row.input1}
                    onChange={(e) => handleInputChange(index, 'input1', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="text-input"
                    value={row.input2}
                    onChange={(e) => handleInputChange(index, 'input2', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="text-input"
                    value={row.input3}
                    onChange={(e) => handleInputChange(index, 'input3', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleAddRow} className="add-roww-button toggle-icon">
        <i className="fas fa-plus "></i>
      </button>
      </div>
    </div>
  );
};

export default PromotionTable;
