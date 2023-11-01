export const fetchTrademarks = async () => {
    try {
      const response = await fetch('https://api.lanha.vn/api/v1/trademarks');
      if (!response.ok) {
        throw new Error('Lỗi khi truy cập API');
      }
      const data = await response.json();
      return data.data; // Trả về phần "data" từ response
    } catch (error) {
      throw error;
    }
  };