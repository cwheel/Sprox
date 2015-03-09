module.exports = {
	entryURL : "https://www.spire.umass.edu/psp/heproda/?cmd=login&languageCd=ENG",
	logoutURL : "https://www.spire.umass.edu/psp/heproda/EMPLOYEE/HRMS/?cmd=logout",
	redirectsDone : ".greeting",

	map : {
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_ACADEMIC_RECORDS.HC_SSS_STUDENT_CENTER&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder&PortalActualURL=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentURL=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fwww.spire.umass.edu%2fpsp%2fheproda%2f&PortalURI=https%3a%2f%2fwww.spire.umass.edu%2fpsc%2fheproda%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes" : {
			schoolAddress : {"tag" : "DERIVED_SSS_SCL_SSS_LONGCHAR_1", remove: []},
		 	homeAddress : {tag : "DERIVED_SSS_SCL_SSS_LONGCHAR_2", remove: []},
		 	email : {tag : "DERIVED_SSS_SCL_EMAIL_ADDR", remove: []},
		 	gradTerm : {tag : "UM_EXP_GRAD_TRM_DESCR", remove: []},
		 	studentName : {tag : "DERIVED_SSS_SCL_TITLE1$78$", remove: ["'s Student Center"]},
		 	classesWeekly : {tag : "[name::CLASS_NAME$span$.*,time::DERIVED_SSS_SCL_SSR_MTG_SCHED_LONG$.*,location::DERIVED_SSS_SCL_SSR_MTG_SCHED_LONG$.*]", remove: []}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_STUDENT_FINANCIALS.UM_QUICKPAY.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_FINANCES.UM_QUICKPAY_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder" : {
			spireId : {tag : "SS_FA_AID_SRCH_EMPLID", remove : []}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_H_SELF_SERVICE.UM_H_SS_ASNNOTIF.GBL?FolderPath=PORTAL_ROOT_OBJECT.HOUSING.UM_H_SS_ASNNOTIF_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder" : {
			mailbox : {tag : "UM_H_DRV_ASN_NT_UMH_BOX_CD", remove : []},
			building : {tag : "UM_H_BLDG_DESCR", remove : []},
			room : {tag : "UM_H_DRV_ASN_NT_UMH_ROOM", remove : []},
			roomType : {tag : "UM_H_DRV_ASN_NT_UMH_ROOM_TYPE", remove : []},
			roomPhone : {tag : "UM_H_DRV_ASN_NT_PHONE", remove : []},
			roomate: {tag : "HCR_PERSON_NM_I_NAME$0", remove : []},
			roomateAddress : {tag : "[address::UM_H_RMMT_ADRVW_ADDRESS1$.*,state::UM_H_RMMT_ADRVW_STATE$.*,city::UM_H_RMMT_ADRVW_CITY$.*,zip::UM_H_RMMT_ADRVW_POSTAL$.*]", remove : []},
			roomateEmail : {tag : "UM_H_ASNOTEM_VW_EMAIL_ADDR$0", remove : []},
			studentFullname : {tag : "UM_H_DRV_ASN_NT_PERSON_NAME", remove : []}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_SELF_SERVICE.UM_LIB_BARCODE.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_PERS_PORTFOLIO.UM_LIB_BARCODE_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder" : {
			ucardRunNumber : {tag : "UM_ISO_NBR_EFF_UM_ISO_NUMBER$0", remove : []},
			ucardLibraryBarcode :  {tag : "UM_DRV_SS_LIBRY_UM_BARCODE$0", remove : []}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_SELF_SERVICE.UM_SS_GRAD_DATA.GBL?FolderPath=PORTAL_ROOT_OBJECT.UM_GRADUATION.UM_SS_GRAD_DATA_GBL&amp;IsFolder=false&amp;IgnoreParamTempl=FolderPath%2cIsFolder" : { 
			major : {tag: "ACAD_PLAN_TBL_DESCR$0", remove: ["(BS)","(BA)"]}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/UM_SELF_SERVICE.UM_SDNT_MEAL_PLAN.GBL?FolderPath=PORTAL_ROOT_OBJECT.HCCC_FINANCES.UM_SDNT_MEAL_PLAN_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder" : {
			mealPlan : {tag: "UM_MEALPLAN_DER_UM_MEAL_PLAN_CD", remove: []}
		},
		"https://www.spire.umass.edu/psc/heproda/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_EXAM_L.GBL" : {
			finals : {tag : "[name::CLASS_NAME$.*,description::DERIVED_REGFRM1_DESCR45$.*,location::DERIVED_REGFRM1_SSR_MTG_LOC_LONG$.*,date::SS_EXAMSCH1_VW_EXAM_DT$.*,time::DERIVED_REGFRM1_SSR_MTG_SCHED_LONG$.*]", remove : []}
		}
		
	}
};
