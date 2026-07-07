package com.nguyenhoa.itam.asset.application.dto;

import java.math.BigDecimal;
import java.util.Map;

public class AssetHealthDto {
    private double finalScore;
    private String healthCondition; // GOOD, FAIR, CRITICAL
    private Map<String, Double> factors;
    private BigDecimal currentDepreciatedValue;
    private String projectedReplacementDate;
    private String appliedPolicyName;
    private Map<String, Integer> appliedWeights;

    public AssetHealthDto() {}

    public double getFinalScore() {
        return finalScore;
    }

    public void setFinalScore(double finalScore) {
        this.finalScore = finalScore;
    }

    public String getHealthCondition() {
        return healthCondition;
    }

    public void setHealthCondition(String healthCondition) {
        this.healthCondition = healthCondition;
    }

    public Map<String, Double> getFactors() {
        return factors;
    }

    public void setFactors(Map<String, Double> factors) {
        this.factors = factors;
    }

    public BigDecimal getCurrentDepreciatedValue() {
        return currentDepreciatedValue;
    }

    public void setCurrentDepreciatedValue(BigDecimal currentDepreciatedValue) {
        this.currentDepreciatedValue = currentDepreciatedValue;
    }

    public String getProjectedReplacementDate() {
        return projectedReplacementDate;
    }

    public void setProjectedReplacementDate(String projectedReplacementDate) {
        this.projectedReplacementDate = projectedReplacementDate;
    }

    public String getAppliedPolicyName() {
        return appliedPolicyName;
    }

    public void setAppliedPolicyName(String appliedPolicyName) {
        this.appliedPolicyName = appliedPolicyName;
    }

    public Map<String, Integer> getAppliedWeights() {
        return appliedWeights;
    }

    public void setAppliedWeights(Map<String, Integer> appliedWeights) {
        this.appliedWeights = appliedWeights;
    }
}
