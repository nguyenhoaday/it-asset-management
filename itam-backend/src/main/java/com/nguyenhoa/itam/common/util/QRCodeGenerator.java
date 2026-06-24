package com.nguyenhoa.itam.common.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.nguyenhoa.itam.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class QRCodeGenerator {
    /*
    Sinh ảnh QR Code từ nội dung bất kỳ.
    Trả về byte[] ảnh PNG — không lưu vào DB, sinh on-the-fly mỗi request.
    @param content nội dung cần mã hóa
    @param width chiều rộng ảnh (px)
    @param height chiều cao ảnh (px)
    @return byte[] ảnh PNG
     */

    public byte[] generateQRCode(String content, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | IOException e) {
            throw new BusinessException("QR_GENERATION_FAILED",
                    "Không thể tạo mã QR cho tài sản này",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
