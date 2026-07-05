package com.nguyenhoa.itam.iam.application.service;

import com.nguyenhoa.itam.iam.domain.UserInfo;
import com.nguyenhoa.itam.iam.domain.UserInfoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GamificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(GamificationScheduler.class);
    private final UserInfoRepository userInfoRepository;

    public GamificationScheduler(UserInfoRepository userInfoRepository) {
        this.userInfoRepository = userInfoRepository;
    }

    // Chạy mỗi ngày vào lúc 1h sáng
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void processDailyGamification() {
        log.info("Start Gamification");

        // Cộng 1 điểm cho mọi người lên đến tối đa 100 điểm
        List<UserInfo> users = userInfoRepository.findAll();
        for (UserInfo user : users) {
            int currentScore = user.getCareScore() != null ? user.getCareScore() : 100;
            // Cộng điểm giữ thiết bị ổn định
            if (currentScore < 100) {
                user.setCareScore(currentScore + 1);
            }
        }
        userInfoRepository.saveAll(users);
        log.info("Completed Gamification");
    }
}
