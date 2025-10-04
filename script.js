// Gilbert 2D 空间填充曲线算法
function gilbert2d(width, height) {
    /**
     * Generalized Hilbert ('gilbert') space-filling curve for arbitrary-sized
     * 2D rectangular grids. Generates discrete 2D coordinates to fill a rectangle
     * of size (width x height).
     */
    const coordinates = [];

    if (width >= height) {
        generate2d(0, 0, width, 0, 0, height, coordinates);
    } else {
        generate2d(0, 0, 0, height, width, 0, coordinates);
    }

    return coordinates;
}

function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);

    const dax = Math.sign(ax), day = Math.sign(ay); // unit major direction
    const dbx = Math.sign(bx), dby = Math.sign(by); // unit orthogonal direction

    if (h === 1) {
        // trivial row fill
        for (let i = 0; i < w; i++) {
            coordinates.push([x, y]);
            x += dax;
            y += day;
        }
        return;
    }

    if (w === 1) {
        // trivial column fill
        for (let i = 0; i < h; i++) {
            coordinates.push([x, y]);
            x += dbx;
            y += dby;
        }
        return;
    }

    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);

    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);

    if (2 * w > 3 * h) {
        if ((w2 % 2) && (w > 2)) {
            // prefer even steps
            ax2 += dax;
            ay2 += day;
        }

        // long case: split in two parts only
        generate2d(x, y, ax2, ay2, bx, by, coordinates);
        generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);

    } else {
        if ((h2 % 2) && (h > 2)) {
            // prefer even steps
            bx2 += dbx;
            by2 += dby;
        }

        // standard case: one step up, one long horizontal, one step down
        generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
        generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
        generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby),
            -bx2, -by2, -(ax - ax2), -(ay - ay2), coordinates);
    }
}

class TomatoImageConfusion {
    constructor() {
        this.originalImage = null;
        this.displayImg = document.getElementById('displayImg');
        this.currentFile = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 文件上传
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // 按钮事件
        document.getElementById('confuseBtn').addEventListener('click', () => {
            this.confuseImage();
        });

        document.getElementById('deconfuseBtn').addEventListener('click', () => {
            this.deconfuseImage();
        });

        document.getElementById('invertBtn').addEventListener('click', () => {
            this.invertImage();
        });

        document.getElementById('convertBtn').addEventListener('click', () => {
            this.convertToJPG();
        });

        // 隐藏的修复按钮（保留功能但不显示）
        document.getElementById('looseBtn').addEventListener('click', () => {
            this.tryLooseModeLoad(this.currentFile);
        });

        document.getElementById('fixHeaderBtn').addEventListener('click', () => {
            this.fixPngHeader(this.currentFile);
        });

        document.getElementById('restoreBtn').addEventListener('click', () => {
            this.restoreImage();
        });

        // 控制参数事件监听
        document.getElementById('confusionStrength').addEventListener('input', (e) => {
            document.getElementById('confusionStrengthValue').textContent = e.target.value;
        });

        document.getElementById('blockSize').addEventListener('input', (e) => {
            document.getElementById('blockSizeValue').textContent = e.target.value;
        });
    }

    // 显示提示消息
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    // 更新图片信息
    updateImageInfo(file, width, height) {
        const imageInfo = document.getElementById('imageInfo');
        const imageSize = document.getElementById('imageSize');
        const fileSize = document.getElementById('fileSize');
        const imageFormat = document.getElementById('imageFormat');
        const imageStatus = document.getElementById('imageStatus');
        
        if (file) {
            imageSize.textContent = `${width} × ${height}`;
            fileSize.textContent = this.formatFileSize(file.size);
            imageFormat.textContent = file.type.split('/')[1].toUpperCase();
            imageStatus.textContent = '已加载';
            imageInfo.style.display = 'block';
        } else {
            imageInfo.style.display = 'none';
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 设置图片源
    setImageSrc(src) {
        try {
            // 先检查旧的URL是否存在，再尝试释放
            if (this.displayImg.src && this.displayImg.src.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(this.displayImg.src);
                } catch (e) {
                    console.log('释放旧URL时出错:', e);
                }
            }
            this.displayImg.src = src;
            this.displayImg.style.display = "inline-block";
        } catch (error) {
            this.showToast('设置图片源失败：' + error.message, 'error');
            console.error('设置图片源错误:', error);
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 重置文件输入，确保可以重复选择同一文件
        event.target.value = '';

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showToast('请选择图片文件！', 'error');
            return;
        }

        // 简化诊断，只检查基本问题
        if (file.size === 0) {
            this.showToast('文件大小为0，请选择有效文件！', 'error');
            return;
        }

        // 检查文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('图片文件过大，请选择小于10MB的图片！', 'warning');
            return;
        }

        this.currentFile = file;
        
        const img = new Image();
        // 支持跨域图片
        img.crossOrigin = 'anonymous';
        
        // 设置超时处理
        const timeoutId = setTimeout(() => {
            this.showToast('图片加载超时！请尝试较小的图片文件。', 'error');
            img.onload = null; // 防止后续加载完成触发
        }, 10000); // 10秒超时
        
        img.onload = () => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            // 验证图片尺寸是否有效
            if (!img.width || !img.height || img.width === 0 || img.height === 0) {
                this.showToast('图片尺寸无效，可能是损坏的图片文件！', 'error');
                return;
            }
            
            // 尝试使用简单方法直接显示图片
            try {
                this.originalImage = img;
                // 直接使用createObjectURL创建的URL设置图片源
                const imageUrl = URL.createObjectURL(file);
                this.displayImg.onload = () => {
                    this.updateImageInfo(file, img.width, img.height);
                    this.showToast(`图片加载成功！格式: ${file.type.split('/')[1].toUpperCase()}，尺寸: ${img.width}×${img.height}`, 'success');
                };
                this.displayImg.onerror = (err) => {
                    this.showToast('图片显示失败！请尝试其他图片文件。', 'error');
                    console.error('图片显示错误:', err);
                };
                this.displayImg.src = imageUrl;
                this.displayImg.style.display = "inline-block";
            } catch (error) {
                this.showToast('图片处理失败：' + error.message, 'error');
                console.error('图片处理错误:', error);
            }
        };
        img.onerror = (err) => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            // 提供更具体的错误信息
            const errorMsg = `图片加载失败！可能原因：文件损坏、格式不支持。文件类型：${file.type}`;
            this.showToast(errorMsg, 'error');
            console.error('图片加载错误:', err);
            
            // 简化错误处理，不再尝试复杂修复
            this.showToast('图片加载失败，请尝试其他图片或使用"转JPG"功能', 'error');
        };
        
        try {
            // 使用try-catch包装URL创建过程
            const blobUrl = URL.createObjectURL(file);
            img.src = blobUrl;
        } catch (error) {
            clearTimeout(timeoutId);
            this.showToast('创建图片URL失败：' + error.message, 'error');
            console.error('URL创建错误:', error);
        }
    }

    // 混淆图片 - 基于Gilbert空间填充曲线
    confuseImage() {
        if (!this.displayImg.src) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在混淆图片...', 'info');
        this.displayImg.style.display = "none";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.encrypt(this.displayImg);
            });
        });
    }

    // 解混淆图片
    deconfuseImage() {
        if (!this.displayImg.src) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在解混淆图片...', 'info');
        this.displayImg.style.display = "none";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.decrypt(this.displayImg);
            });
        });
    }

    // 反相图片
    invertImage() {
        if (!this.displayImg.src) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在反相图片...', 'info');
        this.displayImg.style.display = "none";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.invert(this.displayImg);
            });
        });
    }

    // 还原原始图片
    restoreImage() {
        if (!this.currentFile) {
            this.showToast('没有原始图片可还原！', 'warning');
            return;
        }

        this.setImageSrc(URL.createObjectURL(this.currentFile));
        this.updateImageInfo(this.currentFile, this.originalImage.width, this.originalImage.height);
        this.showToast('已还原原始图片！', 'success');
    }

    // 加密函数 - 基于Gilbert空间填充曲线（支持参数调节）
    encrypt(img) {
        try {
            // 检查图片尺寸是否有效
            if (!img.width || !img.height || img.width === 0 || img.height === 0) {
                this.showToast('处理失败：图片尺寸无效！', 'error');
                this.displayImg.style.display = "inline-block";
                return;
            }
            
            const confusionStrength = parseFloat(document.getElementById('confusionStrength').value);
            const blockSize = parseInt(document.getElementById('blockSize').value);
            
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
            
            // 对于PNG等有透明度的图片，使用白色背景
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0);
            
            // 根据区块大小选择混淆方法
            if (blockSize < 8) {
                // 小区块：使用Gilbert曲线
                this.applyGilbertConfusion(ctx, width, height, confusionStrength);
            } else {
                // 大区块：使用区块混淆（减少方块感）
                this.applyBlockConfusion(ctx, width, height, blockSize, confusionStrength);
            }
            
            cvs.toBlob(b => {
                this.setImageSrc(URL.createObjectURL(b));
                this.showToast(`图片混淆完成！强度: ${confusionStrength}, 区块: ${blockSize}`, 'success');
            }, "image/jpeg", 0.95);
        } catch (error) {
            this.showToast('混淆失败：' + error.message, 'error');
            this.displayImg.style.display = "inline-block";
        }
    }

    // Gilbert曲线混淆
    applyGilbertConfusion(ctx, width, height, strength) {
        const imgdata = ctx.getImageData(0, 0, width, height);
        const imgdata2 = new ImageData(width, height);
        const curve = gilbert2d(width, height);
        const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height * strength);
        
        for (let i = 0; i < width * height; i++) {
            const old_pos = curve[i];
            const new_pos = curve[(i + offset) % (width * height)];
            const old_p = 4 * (old_pos[0] + old_pos[1] * width);
            const new_p = 4 * (new_pos[0] + new_pos[1] * width);
            imgdata2.data.set(imgdata.data.slice(old_p, old_p + 4), new_p);
        }
        
        ctx.putImageData(imgdata2, 0, 0);
    }

    // 区块混淆（减少方块感）
    applyBlockConfusion(ctx, width, height, blockSize, strength) {
        const imgdata = ctx.getImageData(0, 0, width, height);
        const data = imgdata.data;
        
        // 按区块处理，但使用更平滑的算法
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                this.processBlockSmooth(data, x, y, Math.min(blockSize, width - x), Math.min(blockSize, height - y), width, strength);
            }
        }
        
        ctx.putImageData(imgdata, 0, 0);
    }

    // 平滑区块处理
    processBlockSmooth(data, startX, startY, blockWidth, blockHeight, width, strength) {
        // 计算区块中心
        const centerX = startX + blockWidth / 2;
        const centerY = startY + blockHeight / 2;
        
        // 创建临时数组存储原始数据
        const originalData = new Uint8Array(blockWidth * blockHeight * 4);
        
        for (let dy = 0; dy < blockHeight; dy++) {
            for (let dx = 0; dx < blockWidth; dx++) {
                const index = ((startY + dy) * width + (startX + dx)) * 4;
                const tempIndex = (dy * blockWidth + dx) * 4;
                
                originalData[tempIndex] = data[index];
                originalData[tempIndex + 1] = data[index + 1];
                originalData[tempIndex + 2] = data[index + 2];
                originalData[tempIndex + 3] = data[index + 3];
            }
        }
        
        // 应用平滑混淆
        for (let dy = 0; dy < blockHeight; dy++) {
            for (let dx = 0; dx < blockWidth; dx++) {
                const index = ((startY + dy) * width + (startX + dx)) * 4;
                const tempIndex = (dy * blockWidth + dx) * 4;
                
                // 计算距离中心的距离，用于平滑过渡
                const distance = Math.sqrt((dx - blockWidth/2) ** 2 + (dy - blockHeight/2) ** 2);
                const maxDistance = Math.sqrt((blockWidth/2) ** 2 + (blockHeight/2) ** 2);
                const smoothFactor = 1 - (distance / maxDistance) * strength;
                
                // 混合原始颜色和混淆颜色
                data[index] = Math.floor(data[index] * smoothFactor + originalData[tempIndex] * (1 - smoothFactor));
                data[index + 1] = Math.floor(data[index + 1] * smoothFactor + originalData[tempIndex + 1] * (1 - smoothFactor));
                data[index + 2] = Math.floor(data[index + 2] * smoothFactor + originalData[tempIndex + 2] * (1 - smoothFactor));
            }
        }
    }

    // 解密函数 - 基于Gilbert空间填充曲线
    decrypt(img) {
        try {
            // 检查图片尺寸是否有效
            if (!img.width || !img.height || img.width === 0 || img.height === 0) {
                this.showToast('处理失败：图片尺寸无效！', 'error');
                this.displayImg.style.display = "inline-block";
                return;
            }
            
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
            
            // 对于PNG等有透明度的图片，使用白色背景
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0);
            const imgdata = ctx.getImageData(0, 0, width, height);
            const imgdata2 = new ImageData(width, height);
            const curve = gilbert2d(width, height);
            const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);
            
            for (let i = 0; i < width * height; i++) {
                const old_pos = curve[i];
                const new_pos = curve[(i + offset) % (width * height)];
                const old_p = 4 * (old_pos[0] + old_pos[1] * width);
                const new_p = 4 * (new_pos[0] + new_pos[1] * width);
                imgdata2.data.set(imgdata.data.slice(new_p, new_p + 4), old_p);
            }
            
            ctx.putImageData(imgdata2, 0, 0);
            cvs.toBlob(b => {
                this.setImageSrc(URL.createObjectURL(b));
                this.showToast('图片解混淆完成！', 'success');
            }, "image/jpeg", 0.95);
        } catch (error) {
            this.showToast('解混淆失败：' + error.message, 'error');
            this.displayImg.style.display = "inline-block";
        }
    }

    // PNG转JPG函数
    convertToJPG() {
        if (!this.displayImg.src) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在将图片转换为JPG格式...', 'info');
        this.displayImg.style.display = "none";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.convertImageToJPG(this.displayImg);
            });
        });
    }

    // 实际转换逻辑
    convertImageToJPG(img) {
        try {
            // 检查图片尺寸是否有效
            if (!img.width || !img.height || img.width === 0 || img.height === 0) {
                this.showToast('处理失败：图片尺寸无效！', 'error');
                this.displayImg.style.display = "inline-block";
                return;
            }
            
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
            
            // 使用白色背景处理透明度
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0);
            
            // 将图片转换为JPG格式
            cvs.toBlob(b => {
                this.setImageSrc(URL.createObjectURL(b));
                this.showToast('图片已成功转换为JPG格式！', 'success');
            }, "image/jpeg", 0.95);
        } catch (error) {
            this.showToast('转换失败：' + error.message, 'error');
            this.displayImg.style.display = "inline-block";
        }
    }

    // 反相函数
    invert(img) {
        try {
            // 检查图片尺寸是否有效
            if (!img.width || !img.height || img.width === 0 || img.height === 0) {
                this.showToast('处理失败：图片尺寸无效！', 'error');
                this.displayImg.style.display = "inline-block";
                return;
            }
            
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
            
            // 对于PNG等有透明度的图片，使用白色背景
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0);
            const imgdata = ctx.getImageData(0, 0, width, height);
            const data = imgdata.data;
            
            // 反相每个像素的RGB值
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];         // R
                data[i + 1] = 255 - data[i + 1]; // G
                data[i + 2] = 255 - data[i + 2]; // B
                // Alpha 通道保持不变
            }
            
            ctx.putImageData(imgdata, 0, 0);
            cvs.toBlob(b => {
                this.setImageSrc(URL.createObjectURL(b));
                this.showToast('图片反相完成！', 'success');
            }, "image/jpeg", 0.95);
        } catch (error) {
            this.showToast('反相失败：' + error.message, 'error');
            this.displayImg.style.display = "inline-block";
        }
    }

    // 尝试修复图片
    attemptImageRepair(file) {
        this.showToast('正在尝试修复图片...', 'info');
        console.log('开始修复图片，文件信息:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        });
        
        // 方法1: 使用FileReader读取为DataURL
        this.tryFileReaderRepair(file);
    }

    // 方法1: FileReader修复
    tryFileReaderRepair(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('FileReader读取成功，数据长度:', e.target.result.length);
            this.tryImageLoadFromDataURL(e.target.result, file);
        };
        reader.onerror = (error) => {
            console.error('FileReader读取失败:', error);
            this.showToast('文件读取失败，尝试其他方法...', 'warning');
            this.tryBlobRepair(file);
        };
        reader.readAsDataURL(file);
    }

    // 方法2: Blob修复
    tryBlobRepair(file) {
        console.log('尝试Blob修复方法');
        try {
            // 创建新的Blob对象
            const blob = new Blob([file], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            
            const img = new Image();
            img.onload = () => {
                console.log('Blob方法加载成功');
                this.processRepairedImage(img, file);
            };
            img.onerror = (error) => {
                console.error('Blob方法也失败:', error);
                this.tryArrayBufferRepair(file);
            };
            img.src = url;
        } catch (error) {
            console.error('Blob创建失败:', error);
            this.tryArrayBufferRepair(file);
        }
    }

    // 方法3: ArrayBuffer修复
    tryArrayBufferRepair(file) {
        console.log('尝试ArrayBuffer修复方法');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                console.log('ArrayBuffer长度:', arrayBuffer.byteLength);
                
                // 检查PNG文件头
                const uint8Array = new Uint8Array(arrayBuffer);
                const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                let isPng = true;
                for (let i = 0; i < pngHeader.length; i++) {
                    if (uint8Array[i] !== pngHeader[i]) {
                        isPng = false;
                        break;
                    }
                }
                
                if (!isPng) {
                    console.log('PNG文件头检查失败，但文件可能仍然有效');
                    console.log('实际文件头:', Array.from(uint8Array.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                    console.log('期望文件头:', pngHeader.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                    
                    // 不要直接返回，尝试其他方法
                    this.showToast('PNG文件头异常，但尝试继续处理...', 'warning');
                    this.tryPngHeaderRepair(uint8Array, file);
                    return;
                }
                
                // 尝试修复PNG头部
                this.tryPngHeaderRepair(uint8Array, file);
            } catch (error) {
                console.error('ArrayBuffer处理失败:', error);
                this.showToast('图片修复失败：文件可能严重损坏', 'error');
            }
        };
        reader.onerror = () => {
            this.showToast('无法读取文件数据', 'error');
        };
        reader.readAsArrayBuffer(file);
    }

    // 方法4: PNG头部修复
    tryPngHeaderRepair(uint8Array, file) {
        console.log('尝试PNG头部修复');
        try {
            // 创建新的Blob，确保PNG头部正确
            const fixedArray = new Uint8Array(uint8Array);
            const blob = new Blob([fixedArray], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            
            const img = new Image();
            img.onload = () => {
                console.log('PNG头部修复成功');
                this.processRepairedImage(img, file);
            };
            img.onerror = () => {
                console.log('PNG头部修复失败，尝试宽松模式');
                this.tryLooseModeLoad(file);
            };
            img.src = url;
        } catch (error) {
            console.error('PNG头部修复失败:', error);
            this.forceConvertToJPG(file);
        }
    }

    // 方法6: 宽松模式加载（忽略文件头检查）
    tryLooseModeLoad(file) {
        console.log('尝试宽松模式加载');
        this.showToast('尝试宽松模式加载图片...', 'info');
        
        // 直接使用原始文件，不进行任何检查
        const url = URL.createObjectURL(file);
        const img = new Image();
        
        // 设置更长的超时时间
        const timeoutId = setTimeout(() => {
            this.showToast('宽松模式加载超时', 'error');
        }, 15000);
        
        img.onload = () => {
            clearTimeout(timeoutId);
            console.log('宽松模式加载成功');
            this.originalImage = img;
            this.setImageSrc(url);
            this.updateImageInfo(file, img.width, img.height);
            this.showToast('图片加载成功！（宽松模式）', 'success');
        };
        
        img.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('宽松模式也失败:', error);
            this.showToast('所有方法都失败了，文件可能严重损坏', 'error');
        };
        
        img.src = url;
    }

    // 方法5: 强制转换为JPG
    forceConvertToJPG(file) {
        console.log('尝试强制转换为JPG');
        this.showToast('尝试强制转换为JPG格式...', 'info');
        
        // 使用Canvas强制绘制
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置默认尺寸
        canvas.width = 800;
        canvas.height = 600;
        
        // 填充白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 尝试绘制文件内容
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const jpgFile = new File([blob], 'force_converted.jpg', { type: 'image/jpeg' });
                    this.currentFile = jpgFile;
                    this.originalImage = img;
                    this.setImageSrc(URL.createObjectURL(blob));
                    this.updateImageInfo(jpgFile, img.width, img.height);
                    this.showToast('强制转换成功！', 'success');
                } else {
                    this.showToast('所有修复方法都失败了', 'error');
                }
            }, 'image/jpeg', 0.8);
        };
        img.onerror = () => {
            this.showToast('图片严重损坏，无法修复', 'error');
        };
        img.src = URL.createObjectURL(file);
    }

    // 尝试从DataURL加载图片
    tryImageLoadFromDataURL(dataURL, file) {
        const img = new Image();
        img.onload = () => {
            console.log('DataURL方法加载成功');
            this.processRepairedImage(img, file);
        };
        img.onerror = (error) => {
            console.error('DataURL方法失败:', error);
            this.tryBlobRepair(file);
        };
        img.src = dataURL;
    }

    // 处理修复成功的图片
    processRepairedImage(img, originalFile) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制到画布上
            ctx.drawImage(img, 0, 0);
            
            // 转换为JPG格式
            canvas.toBlob((blob) => {
                if (blob) {
                    const repairedFile = new File([blob], 'repaired.jpg', { type: 'image/jpeg' });
                    this.currentFile = repairedFile;
                    this.originalImage = img;
                    this.setImageSrc(URL.createObjectURL(blob));
                    this.updateImageInfo(repairedFile, img.width, img.height);
                    this.showToast('图片修复成功！已转换为JPG格式', 'success');
                } else {
                    this.showToast('图片修复失败，请尝试其他图片', 'error');
                }
            }, 'image/jpeg', 0.9);
        } catch (error) {
            console.error('处理修复图片时出错:', error);
            this.showToast('图片修复失败：' + error.message, 'error');
        }
    }

    // 诊断文件问题
    diagnoseFile(file) {
        console.log('=== 文件诊断开始 ===');
        console.log('文件名:', file.name);
        console.log('文件大小:', file.size, 'bytes');
        console.log('MIME类型:', file.type);
        console.log('最后修改时间:', new Date(file.lastModified));
        
        // 检查文件大小
        if (file.size === 0) {
            this.showToast('文件大小为0，文件可能损坏！', 'error');
            return;
        }
        
        if (file.size < 100) {
            this.showToast('文件太小，可能不是有效的图片文件！', 'warning');
        }
        
        // 检查MIME类型
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            this.showToast(`文件类型 ${file.type} 可能不被支持！`, 'warning');
        }
        
        // 检查PNG文件头
        if (file.type === 'image/png') {
            this.checkPngHeader(file);
        }
        
        console.log('=== 文件诊断结束 ===');
        console.log('💡 提示：如果电脑可以预览但浏览器无法加载，可能的原因：');
        console.log('1. 文件头格式不标准（但内容有效）');
        console.log('2. 浏览器安全限制');
        console.log('3. 文件编码问题');
        console.log('4. 抖音等应用的特殊编码');
        console.log('💡 建议：尝试点击"宽松模式"按钮');
    }

    // 检查PNG文件头
    checkPngHeader(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // PNG文件头: 89 50 4E 47 0D 0A 1A 0A
            const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            let isValidPng = true;
            
            for (let i = 0; i < pngSignature.length; i++) {
                if (uint8Array[i] !== pngSignature[i]) {
                    isValidPng = false;
                    break;
                }
            }
            
            if (!isValidPng) {
                console.error('PNG文件头无效！');
                this.showToast('PNG文件头无效，文件可能损坏！', 'error');
            } else {
                console.log('PNG文件头有效');
            }
            
            // 检查文件是否以IEND块结尾
            const iendSignature = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
            const fileEnd = uint8Array.slice(-8);
            let hasValidEnd = true;
            
            for (let i = 0; i < iendSignature.length; i++) {
                if (fileEnd[i] !== iendSignature[i]) {
                    hasValidEnd = false;
                    break;
                }
            }
            
            if (!hasValidEnd) {
                console.warn('PNG文件可能不完整（缺少IEND块）');
                this.showToast('PNG文件可能不完整，尝试修复...', 'warning');
            }
        };
        reader.readAsArrayBuffer(file.slice(0, 100)); // 只读取前100字节
    }

    // 转换为JPG格式
    convertToJPG() {
        if (!this.displayImg.src) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在转换为JPG格式...', 'info');
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = this.displayImg;
            
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            // 绘制图片到画布
            ctx.drawImage(img, 0, 0);
            
            // 转换为JPG
            canvas.toBlob((blob) => {
                if (blob) {
                    const jpgFile = new File([blob], 'converted.jpg', { type: 'image/jpeg' });
                    this.currentFile = jpgFile;
                    this.setImageSrc(URL.createObjectURL(blob));
                    this.updateImageInfo(jpgFile, canvas.width, canvas.height);
                    this.showToast('图片已转换为JPG格式！', 'success');
                } else {
                    this.showToast('转换失败！', 'error');
                }
            }, 'image/jpeg', 0.95);
        } catch (error) {
            this.showToast('转换失败：' + error.message, 'error');
        }
    }

    // 修复PNG文件头
    fixPngHeader(file) {
        if (!file) {
            this.showToast('请先选择一张图片！', 'warning');
            return;
        }

        this.showToast('正在修复PNG文件头...', 'info');
        console.log('开始修复PNG文件头');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                console.log('原始文件头:', Array.from(uint8Array.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                
                // 创建修复后的数组
                const fixedArray = new Uint8Array(arrayBuffer.length + 8);
                
                // 添加标准PNG文件头: 89 50 4E 47 0D 0A 1A 0A
                const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                for (let i = 0; i < pngHeader.length; i++) {
                    fixedArray[i] = pngHeader[i];
                }
                
                // 复制原始数据（跳过可能存在的错误头部）
                let startIndex = 0;
                
                // 检查是否已经有PNG头部
                const existingHeader = Array.from(uint8Array.slice(0, 8));
                const isPngHeader = existingHeader[0] === 0x89 && existingHeader[1] === 0x50;
                
                if (isPngHeader) {
                    console.log('文件已有PNG头部，尝试其他修复方法');
                    this.tryAlternativePngFix(uint8Array, file);
                    return;
                }
                
                // 查找IHDR块开始位置
                const ihdrPattern = [0x49, 0x48, 0x44, 0x52]; // "IHDR"
                let ihdrIndex = -1;
                
                for (let i = 0; i < uint8Array.length - 4; i++) {
                    if (uint8Array[i] === ihdrPattern[0] && 
                        uint8Array[i+1] === ihdrPattern[1] && 
                        uint8Array[i+2] === ihdrPattern[2] && 
                        uint8Array[i+3] === ihdrPattern[3]) {
                        ihdrIndex = i;
                        break;
                    }
                }
                
                if (ihdrIndex > 0) {
                    console.log('找到IHDR块，位置:', ihdrIndex);
                    startIndex = ihdrIndex - 8; // IHDR前8字节是长度和类型
                } else {
                    console.log('未找到IHDR块，使用原始数据');
                    startIndex = 0;
                }
                
                // 复制数据
                for (let i = startIndex; i < uint8Array.length; i++) {
                    fixedArray[8 + (i - startIndex)] = uint8Array[i];
                }
                
                console.log('修复后文件头:', Array.from(fixedArray.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                
                // 创建修复后的文件
                const fixedBlob = new Blob([fixedArray], { type: 'image/png' });
                const fixedFile = new File([fixedBlob], 'fixed_header.png', { type: 'image/png' });
                
                // 尝试加载修复后的文件
                const img = new Image();
                img.onload = () => {
                    console.log('PNG文件头修复成功！');
                    this.currentFile = fixedFile;
                    this.originalImage = img;
                    this.setImageSrc(URL.createObjectURL(fixedBlob));
                    this.updateImageInfo(fixedFile, img.width, img.height);
                    this.showToast('PNG文件头修复成功！', 'success');
                };
                img.onerror = (error) => {
                    console.error('修复后文件仍无法加载:', error);
                    this.showToast('文件头修复失败，尝试其他方法...', 'warning');
                    this.tryAlternativePngFix(uint8Array, file);
                };
                img.src = URL.createObjectURL(fixedBlob);
                
            } catch (error) {
                console.error('PNG文件头修复失败:', error);
                this.showToast('文件头修复失败：' + error.message, 'error');
            }
        };
        reader.onerror = () => {
            this.showToast('无法读取文件数据', 'error');
        };
        reader.readAsArrayBuffer(file);
    }

    // 尝试其他PNG修复方法
    tryAlternativePngFix(uint8Array, file) {
        console.log('尝试其他PNG修复方法');
        this.showToast('尝试其他修复方法...', 'info');
        
        try {
            // 方法1: 直接添加PNG头部
            const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            const fixedArray = new Uint8Array(pngHeader.length + uint8Array.length);
            
            // 添加PNG头部
            for (let i = 0; i < pngHeader.length; i++) {
                fixedArray[i] = pngHeader[i];
            }
            
            // 添加原始数据
            for (let i = 0; i < uint8Array.length; i++) {
                fixedArray[pngHeader.length + i] = uint8Array[i];
            }
            
            const fixedBlob = new Blob([fixedArray], { type: 'image/png' });
            const fixedFile = new File([fixedBlob], 'alternative_fixed.png', { type: 'image/png' });
            
            const img = new Image();
            img.onload = () => {
                console.log('替代方法修复成功！');
                this.currentFile = fixedFile;
                this.originalImage = img;
                this.setImageSrc(URL.createObjectURL(fixedBlob));
                this.updateImageInfo(fixedFile, img.width, img.height);
                this.showToast('PNG文件修复成功！（替代方法）', 'success');
            };
            img.onerror = () => {
                console.log('替代方法也失败，尝试转换为JPG');
                this.forceConvertToJPG(file);
            };
            img.src = URL.createObjectURL(fixedBlob);
            
        } catch (error) {
            console.error('替代修复方法失败:', error);
            this.showToast('所有修复方法都失败了', 'error');
        }
    }

}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TomatoImageConfusion();
});
