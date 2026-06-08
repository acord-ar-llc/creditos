package validator

import (
	"fmt"
	"strconv"
	"strings"
)

// ValidateCUIT validates an Argentine CUIT/CUIL number.
// Format: XX-XXXXXXXX-X (11 digits total).
func ValidateCUIT(cuit string) error {
	cleaned := strings.ReplaceAll(cuit, "-", "")
	if len(cleaned) != 11 {
		return fmt.Errorf("CUIT must have 11 digits, got %d", len(cleaned))
	}

	for _, c := range cleaned {
		if c < '0' || c > '9' {
			return fmt.Errorf("CUIT must contain only digits")
		}
	}

	prefix := cleaned[:2]
	validPrefixes := map[string]bool{
		"20": true, "23": true, "24": true, "27": true,
		"30": true, "33": true, "34": true,
	}
	if !validPrefixes[prefix] {
		return fmt.Errorf("invalid CUIT prefix: %s", prefix)
	}

	weights := []int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i, w := range weights {
		d, _ := strconv.Atoi(string(cleaned[i]))
		sum += d * w
	}

	remainder := sum % 11
	var expectedDigit int
	switch remainder {
	case 0:
		expectedDigit = 0
	case 1:
		expectedDigit = 9
	default:
		expectedDigit = 11 - remainder
	}

	actualDigit, _ := strconv.Atoi(string(cleaned[10]))
	if actualDigit != expectedDigit {
		return fmt.Errorf("invalid CUIT check digit: expected %d, got %d", expectedDigit, actualDigit)
	}

	return nil
}

// ValidateDNI validates an Argentine DNI number (7 or 8 digits).
func ValidateDNI(dni string) error {
	cleaned := strings.TrimSpace(dni)
	if len(cleaned) < 7 || len(cleaned) > 8 {
		return fmt.Errorf("DNI must have 7 or 8 digits, got %d", len(cleaned))
	}
	for _, c := range cleaned {
		if c < '0' || c > '9' {
			return fmt.Errorf("DNI must contain only digits")
		}
	}
	return nil
}

// FormatCUIT formats a CUIT as XX-XXXXXXXX-X.
func FormatCUIT(cuit string) string {
	cleaned := strings.ReplaceAll(cuit, "-", "")
	if len(cleaned) != 11 {
		return cuit
	}
	return cleaned[:2] + "-" + cleaned[2:10] + "-" + cleaned[10:]
}

// Country codes used to dispatch country-specific validation.
const (
	CountryAR = "AR"
	CountryCO = "CO"
)

// ValidateCedula validates a Colombian Cédula de Ciudadanía.
// It is a numeric document of 6 to 10 digits with no official check digit.
func ValidateCedula(cedula string) error {
	cleaned := strings.ReplaceAll(strings.TrimSpace(cedula), ".", "")
	if len(cleaned) < 6 || len(cleaned) > 10 {
		return fmt.Errorf("cedula must have 6 to 10 digits, got %d", len(cleaned))
	}
	for _, c := range cleaned {
		if c < '0' || c > '9' {
			return fmt.Errorf("cedula must contain only digits")
		}
	}
	return nil
}

// nitWeights are the DIAN check-digit weights applied right-to-left to the NIT base.
var nitWeights = []int{3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71}

// CalculateNITCheckDigit computes the Colombian NIT verification digit (DV)
// for a numeric base (the NIT without its check digit), per the DIAN algorithm.
func CalculateNITCheckDigit(base string) int {
	sum := 0
	for i := 0; i < len(base); i++ {
		d := int(base[len(base)-1-i] - '0')
		sum += d * nitWeights[i]
	}
	remainder := sum % 11
	if remainder >= 2 {
		return 11 - remainder
	}
	return remainder
}

// ValidateNIT validates a Colombian NIT, including its verification digit.
// Accepts an optional dash/dot before the DV (e.g. "900123456-7" or "9001234567").
func ValidateNIT(nit string) error {
	cleaned := strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(nit), "-", ""), ".", "")
	if len(cleaned) < 9 || len(cleaned) > 16 {
		return fmt.Errorf("NIT must have 9 to 16 digits, got %d", len(cleaned))
	}
	for _, c := range cleaned {
		if c < '0' || c > '9' {
			return fmt.Errorf("NIT must contain only digits")
		}
	}
	base := cleaned[:len(cleaned)-1]
	expected := CalculateNITCheckDigit(base)
	actual := int(cleaned[len(cleaned)-1] - '0')
	if actual != expected {
		return fmt.Errorf("invalid NIT check digit: expected %d, got %d", expected, actual)
	}
	return nil
}

// ValidateNationalID validates the personal identity document for the given country
// (Argentina: DNI; Colombia: Cédula de Ciudadanía).
func ValidateNationalID(id, country string) error {
	switch country {
	case CountryCO:
		return ValidateCedula(id)
	default:
		return ValidateDNI(id)
	}
}

// ValidateTaxID validates the fiscal identity for the given country
// (Argentina: CUIT; Colombia: NIT).
func ValidateTaxID(id, country string) error {
	switch country {
	case CountryCO:
		return ValidateNIT(id)
	default:
		return ValidateCUIT(id)
	}
}
