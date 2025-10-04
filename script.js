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

        document.getElementById('restoreBtn').addEventListener('click', () => {
            this.restoreImage();
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
        URL.revokeObjectURL(this.displayImg.src);
        this.displayImg.src = src;
        this.displayImg.style.display = "inline-block";
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.showToast('请选择图片文件！', 'error');
            return;
        }

        // 检查文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('图片文件过大，请选择小于10MB的图片！', 'warning');
            return;
        }

        this.currentFile = file;
        
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.setImageSrc(URL.createObjectURL(file));
            this.updateImageInfo(file, img.width, img.height);
            this.showToast('图片加载成功！', 'success');
        };
        img.onerror = () => {
            this.showToast('图片加载失败！', 'error');
        };
        img.src = URL.createObjectURL(file);
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

    // 加密函数 - 基于Gilbert空间填充曲线
    encrypt(img) {
        try {
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
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
                imgdata2.data.set(imgdata.data.slice(old_p, old_p + 4), new_p);
            }
            
            ctx.putImageData(imgdata2, 0, 0);
            cvs.toBlob(b => {
                this.setImageSrc(URL.createObjectURL(b));
                this.showToast('图片混淆完成！', 'success');
            }, "image/jpeg", 0.95);
        } catch (error) {
            this.showToast('混淆失败：' + error.message, 'error');
        }
    }

    // 解密函数 - 基于Gilbert空间填充曲线
    decrypt(img) {
        try {
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
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
        }
    }

    // 反相函数
    invert(img) {
        try {
            const cvs = document.createElement("canvas");
            const width = cvs.width = img.width;
            const height = cvs.height = img.height;
            const ctx = cvs.getContext("2d");
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
        }
    }

}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TomatoImageConfusion();
});
