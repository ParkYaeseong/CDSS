# omics/preprocessing_utils.py

import pandas as pd
import numpy as np
import pyranges as pr
import logging

logger = logging.getLogger(__name__)

def load_feature_list(path):
    """특징 목록 파일을 읽어 리스트로 반환하는 함수"""
    with open(path, 'r') as f:
        features = [line.strip() for line in f]
    return features

def preprocess_long_format(raw_df, feature_col, value_col):
    """Long-format 데이터를 단일 환자의 wide-format으로 변환"""
    if raw_df.empty or not all(c in raw_df.columns for c in [feature_col, value_col]):
        logger.warning(f"preprocess_long_format: 필수 컬럼({feature_col}, {value_col})이 없습니다.")
        return pd.DataFrame()

    df_subset = raw_df[[feature_col, value_col]].copy()
    df_subset['patient_id_temp'] = 'single_patient'
    
    processed_df = df_subset.pivot_table(
        index='patient_id_temp', columns=feature_col, values=value_col, aggfunc='mean'
    )
    return processed_df

def map_cnv_segments_to_genes(raw_segment_df, gtf_cached_df):
    """Segment 레벨의 CNV 데이터를 Gene 레벨로 변환"""
    if gtf_cached_df is None:
        raise ValueError("GTF data is not cached or provided.")
    
    gr_genes = pr.PyRanges(gtf_cached_df)
    
    gr_segments = raw_segment_df[['Chromosome', 'Start', 'End', 'Segment_Mean']].copy()
    gr_segments['Chromosome'] = 'chr' + gr_segments['Chromosome'].astype(str)
    gr_segments = pr.PyRanges(gr_segments)
    
    overlapped = gr_genes.join(gr_segments)
    if overlapped.df.empty:
        logger.warning("CNV 세그먼트와 유전자 위치 정보가 겹치지 않습니다.")
        return pd.DataFrame()

    gene_level_cnv = overlapped.df.groupby('gene_name')['Segment_Mean'].mean()
    
    patient_cnv_df = gene_level_cnv.to_frame().T
    patient_cnv_df.index = ['single_patient']
    return patient_cnv_df

def preprocess_mutation_file(raw_df):
    """MAF 형식의 데이터를 받아 유전자별 변이 유무(0/1)로 변환"""
    if raw_df.empty or 'Variant_Classification' not in raw_df.columns or 'Hugo_Symbol' not in raw_df.columns:
        return pd.DataFrame()

    meaningful_variants = [
        'Frame_Shift_Del', 'Frame_Shift_Ins', 'In_Frame_Del', 'In_Frame_Ins',
        'Missense_Mutation', 'Nonsense_Mutation', 'Splice_Site', 'Translation_Start_Site', 'Nonstop_Mutation'
    ]
    
    filtered_df = raw_df[raw_df['Variant_Classification'].isin(meaningful_variants)]
    if filtered_df.empty: return pd.DataFrame()
    
    processed_df = pd.crosstab(index=['single_patient'], columns=filtered_df['Hugo_Symbol'])
    return (processed_df > 0).astype(int)