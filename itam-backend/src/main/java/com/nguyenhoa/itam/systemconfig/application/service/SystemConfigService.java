package com.nguyenhoa.itam.systemconfig.application.service;

import com.nguyenhoa.itam.systemconfig.domain.SystemConfig;
import com.nguyenhoa.itam.systemconfig.domain.SystemConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SystemConfigService {
    private final SystemConfigRepository systemConfigRepository;

    public SystemConfigService(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    @Transactional(readOnly = true)
    public int getConfigInt(String key, int defaultValue) {
        return systemConfigRepository.findById(key)
                .map(SystemConfig::getConfigValue)
                .map(Integer::parseInt)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public List<SystemConfig> getAllConfigs() {
        return systemConfigRepository.findAll();
    }

    @Transactional
    public void updateConfigs(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            systemConfigRepository.findById(entry.getKey()).ifPresent(config -> {
                config.setConfigValue(entry.getValue());
                systemConfigRepository.save(config);
            });
        }
    }
}
