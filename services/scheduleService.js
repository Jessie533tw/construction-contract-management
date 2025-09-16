const { ConstructionSchedule } = require('../models/dataModels');

class ScheduleService {
    constructor() {
        this.constructionSchedules = new Map();
        this.progressTracking = new Map();
        this.alerts = [];
    }

    createConstructionSchedule(projectName, projectCode) {
        const schedule = new ConstructionSchedule(projectName, projectCode);
        this.constructionSchedules.set(projectCode, schedule);
        return schedule;
    }

    addPurchaseOrderToSchedule(projectCode, purchaseOrder) {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        purchaseOrder.items.forEach(item => {
            schedule.addScheduleItem(
                purchaseOrder.poId,
                item.itemName,
                purchaseOrder.expectedDeliveryDate
            );
        });

        console.log(`採購單 ${purchaseOrder.poId} 已加入 ${projectCode} 施工進度表`);
        return schedule;
    }

    updateDeliveryStatus(projectCode, poId, actualDeliveryDate) {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        schedule.updateDeliveryStatus(poId, actualDeliveryDate);
        
        this.checkDeliveryAlert(schedule, poId);
        
        return schedule;
    }

    updateConstructionProgress(projectCode, poId, progress, remarks = '') {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        schedule.updateConstructionProgress(poId, progress);

        const progressRecord = {
            date: new Date(),
            projectCode,
            poId,
            progress,
            remarks,
            updatedBy: 'system'
        };

        const key = `${projectCode}-${poId}`;
        if (!this.progressTracking.get(key)) {
            this.progressTracking.set(key, []);
        }
        this.progressTracking.get(key).push(progressRecord);

        console.log(`專案 ${projectCode} 採購單 ${poId} 施工進度更新為 ${progress}%`);
        
        return schedule;
    }

    checkDeliveryAlert(schedule, poId) {
        const item = schedule.scheduleItems.find(item => item.poId === poId);
        if (!item || !item.actualDeliveryDate) return;

        const delayDays = Math.ceil((item.actualDeliveryDate - item.expectedDeliveryDate) / (1000 * 60 * 60 * 24));
        
        if (delayDays > 0) {
            const alert = {
                type: 'DELIVERY_DELAY',
                projectCode: schedule.projectCode,
                poId: poId,
                itemName: item.itemName,
                delayDays: delayDays,
                expectedDate: item.expectedDeliveryDate.toLocaleDateString(),
                actualDate: item.actualDeliveryDate.toLocaleDateString(),
                createDate: new Date(),
                severity: delayDays > 7 ? 'HIGH' : delayDays > 3 ? 'MEDIUM' : 'LOW'
            };
            
            this.alerts.push(alert);
            console.log(`⚠️  交期警告：專案 ${schedule.projectCode} 採購單 ${poId} 延遲 ${delayDays} 天`);
        }
    }

    generateScheduleReport(projectCode) {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        const currentDate = new Date();
        const report = {
            專案資訊: {
                專案名稱: schedule.projectName,
                專案編號: schedule.projectCode,
                建立日期: schedule.createDate.toLocaleDateString(),
                整體進度: schedule.overallProgress.toFixed(1) + '%'
            },
            進度統計: {
                總項目數: schedule.scheduleItems.length,
                待交貨: schedule.scheduleItems.filter(item => item.status === 'PENDING').length,
                已交貨: schedule.scheduleItems.filter(item => item.status === 'DELIVERED').length,
                已完工: schedule.scheduleItems.filter(item => item.status === 'COMPLETED').length,
                延遲項目: schedule.scheduleItems.filter(item => 
                    item.expectedDeliveryDate < currentDate && item.status === 'PENDING'
                ).length
            },
            交期分析: this.analyzeDeliverySchedule(schedule),
            施工進度分析: this.analyzeConstructionProgress(schedule),
            項目明細: schedule.scheduleItems.map(item => ({
                採購單號: item.poId,
                項目名稱: item.itemName,
                預計交期: item.expectedDeliveryDate.toLocaleDateString(),
                實際交期: item.actualDeliveryDate ? item.actualDeliveryDate.toLocaleDateString() : '未交貨',
                施工進度: item.constructionProgress + '%',
                狀態: item.status,
                延遲天數: item.actualDeliveryDate 
                    ? Math.max(0, Math.ceil((item.actualDeliveryDate - item.expectedDeliveryDate) / (1000 * 60 * 60 * 24)))
                    : item.expectedDeliveryDate < currentDate 
                        ? Math.ceil((currentDate - item.expectedDeliveryDate) / (1000 * 60 * 60 * 24))
                        : 0
            }))
        };

        return report;
    }

    analyzeDeliverySchedule(schedule) {
        const currentDate = new Date();
        const analysis = {
            準時交貨項目: 0,
            延遲交貨項目: 0,
            待交貨項目: 0,
            平均延遲天數: 0,
            最大延遲天數: 0
        };

        let totalDelay = 0;
        let delayCount = 0;

        schedule.scheduleItems.forEach(item => {
            if (item.status === 'PENDING') {
                analysis.待交貨項目++;
            } else if (item.actualDeliveryDate) {
                const delayDays = Math.ceil((item.actualDeliveryDate - item.expectedDeliveryDate) / (1000 * 60 * 60 * 24));
                if (delayDays <= 0) {
                    analysis.準時交貨項目++;
                } else {
                    analysis.延遲交貨項目++;
                    totalDelay += delayDays;
                    delayCount++;
                    analysis.最大延遲天數 = Math.max(analysis.最大延遲天數, delayDays);
                }
            }
        });

        analysis.平均延遲天數 = delayCount > 0 ? (totalDelay / delayCount).toFixed(1) : 0;
        analysis.準時交貨率 = schedule.scheduleItems.length > 0 
            ? ((analysis.準時交貨項目 / (analysis.準時交貨項目 + analysis.延遲交貨項目)) * 100).toFixed(1) + '%'
            : '0%';

        return analysis;
    }

    analyzeConstructionProgress(schedule) {
        const progressRanges = {
            '0%': 0,
            '1-25%': 0,
            '26-50%': 0,
            '51-75%': 0,
            '76-99%': 0,
            '100%': 0
        };

        schedule.scheduleItems.forEach(item => {
            const progress = item.constructionProgress;
            if (progress === 0) {
                progressRanges['0%']++;
            } else if (progress <= 25) {
                progressRanges['1-25%']++;
            } else if (progress <= 50) {
                progressRanges['26-50%']++;
            } else if (progress <= 75) {
                progressRanges['51-75%']++;
            } else if (progress < 100) {
                progressRanges['76-99%']++;
            } else {
                progressRanges['100%']++;
            }
        });

        return progressRanges;
    }

    getUpcomingDeliveries(projectCode, days = 7) {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        const currentDate = new Date();
        const targetDate = new Date();
        targetDate.setDate(currentDate.getDate() + days);

        const upcomingDeliveries = schedule.scheduleItems.filter(item => 
            item.status === 'PENDING' &&
            item.expectedDeliveryDate >= currentDate &&
            item.expectedDeliveryDate <= targetDate
        );

        return upcomingDeliveries.map(item => ({
            採購單號: item.poId,
            項目名稱: item.itemName,
            預計交期: item.expectedDeliveryDate.toLocaleDateString(),
            剩餘天數: Math.ceil((item.expectedDeliveryDate - currentDate) / (1000 * 60 * 60 * 24))
        }));
    }

    getOverdueItems(projectCode) {
        const schedule = this.constructionSchedules.get(projectCode);
        if (!schedule) {
            throw new Error(`專案 ${projectCode} 的施工進度表不存在`);
        }

        const currentDate = new Date();
        const overdueItems = schedule.scheduleItems.filter(item => 
            item.status === 'PENDING' && item.expectedDeliveryDate < currentDate
        );

        return overdueItems.map(item => ({
            採購單號: item.poId,
            項目名稱: item.itemName,
            預計交期: item.expectedDeliveryDate.toLocaleDateString(),
            逾期天數: Math.ceil((currentDate - item.expectedDeliveryDate) / (1000 * 60 * 60 * 24))
        }));
    }

    getConstructionSchedule(projectCode) {
        return this.constructionSchedules.get(projectCode);
    }

    getAllConstructionSchedules() {
        return Array.from(this.constructionSchedules.values());
    }

    getProgressHistory(projectCode, poId) {
        const key = `${projectCode}-${poId}`;
        return this.progressTracking.get(key) || [];
    }

    getAlerts(severity = null, limit = 50) {
        let filteredAlerts = this.alerts;
        
        if (severity) {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
        }

        return filteredAlerts
            .sort((a, b) => b.createDate - a.createDate)
            .slice(0, limit);
    }

    markAlertAsRead(alertIndex) {
        if (alertIndex >= 0 && alertIndex < this.alerts.length) {
            this.alerts[alertIndex].isRead = true;
            this.alerts[alertIndex].readDate = new Date();
        }
    }

    exportScheduleToExcel(projectCode) {
        const report = this.generateScheduleReport(projectCode);
        
        return {
            專案資訊: report.專案資訊,
            統計摘要: {
                ...report.進度統計,
                ...report.交期分析
            },
            項目明細: report.項目明細,
            即將到期項目: this.getUpcomingDeliveries(projectCode),
            逾期項目: this.getOverdueItems(projectCode)
        };
    }

    generateDashboard() {
        const allSchedules = Array.from(this.constructionSchedules.values());
        
        return {
            總覽: {
                專案總數: allSchedules.length,
                活躍專案數: allSchedules.filter(s => s.overallProgress < 100).length,
                完工專案數: allSchedules.filter(s => s.overallProgress >= 100).length,
                待處理警告: this.alerts.filter(a => !a.isRead).length
            },
            專案列表: allSchedules.map(schedule => ({
                專案名稱: schedule.projectName,
                專案編號: schedule.projectCode,
                整體進度: schedule.overallProgress.toFixed(1) + '%',
                項目總數: schedule.scheduleItems.length,
                逾期項目: this.getOverdueItems(schedule.projectCode).length
            }))
        };
    }
}

module.exports = ScheduleService;