// DO NOT EDIT
// Code generated by GrpcClientsGenerator based on mercari/platform-client version.
// To regenerate manually, run `make grpc/regen-clients-wrapper`

package mercariapius

import (
	"github.com/golang/mock/gomock"
	"google.golang.org/grpc"

	mercariapiPb "github.com/kouzoh/platform-client-go/src/api-us/v1"
)

const Version = "v0.1026.0"

type (
	Services struct {
		Chat                mercariapiPb.ChatClient
		Coupons             mercariapiPb.CouponsClient
		Goals               mercariapiPb.GoalsClient
		HelpCenter          mercariapiPb.HelpCenterClient
		Invitation          mercariapiPb.InvitationClient
		Items               mercariapiPb.ItemsClient
		Login               mercariapiPb.LoginClient
		Notifications       mercariapiPb.NotificationsClient
		PRRedirection       mercariapiPb.PRRedirectionClient
		PersonalAttributes  mercariapiPb.PersonalAttributesClient
		Points              mercariapiPb.PointsClient
		TransactionEvidence mercariapiPb.TransactionEvidenceClient
		Users               mercariapiPb.UsersClient
	}

	MockServices struct {
		Chat                mercariapiPb.MockChatClient
		Coupons             mercariapiPb.MockCouponsClient
		Goals               mercariapiPb.MockGoalsClient
		HelpCenter          mercariapiPb.MockHelpCenterClient
		Invitation          mercariapiPb.MockInvitationClient
		Items               mercariapiPb.MockItemsClient
		Login               mercariapiPb.MockLoginClient
		Notifications       mercariapiPb.MockNotificationsClient
		PRRedirection       mercariapiPb.MockPRRedirectionClient
		PersonalAttributes  mercariapiPb.MockPersonalAttributesClient
		Points              mercariapiPb.MockPointsClient
		TransactionEvidence mercariapiPb.MockTransactionEvidenceClient
		Users               mercariapiPb.MockUsersClient
	}
)

func (s *Services) Name() string {
	return "mercari-api-us"
}

func New(cc grpc.ClientConnInterface) *Services {
	return &Services{
		Chat:                mercariapiPb.NewChatClient(cc),
		Coupons:             mercariapiPb.NewCouponsClient(cc),
		Goals:               mercariapiPb.NewGoalsClient(cc),
		HelpCenter:          mercariapiPb.NewHelpCenterClient(cc),
		Invitation:          mercariapiPb.NewInvitationClient(cc),
		Items:               mercariapiPb.NewItemsClient(cc),
		Login:               mercariapiPb.NewLoginClient(cc),
		Notifications:       mercariapiPb.NewNotificationsClient(cc),
		PRRedirection:       mercariapiPb.NewPRRedirectionClient(cc),
		PersonalAttributes:  mercariapiPb.NewPersonalAttributesClient(cc),
		Points:              mercariapiPb.NewPointsClient(cc),
		TransactionEvidence: mercariapiPb.NewTransactionEvidenceClient(cc),
		Users:               mercariapiPb.NewUsersClient(cc),
	}
}

func NewMock(ctrl *gomock.Controller) *MockServices {
	return &MockServices{
		Chat:                mercariapiPb.NewMockChatClient(ctrl),
		Coupons:             mercariapiPb.NewMockCouponsClient(ctrl),
		Goals:               mercariapiPb.NewMockGoalsClient(ctrl),
		HelpCenter:          mercariapiPb.NewMockHelpCenterClient(ctrl),
		Invitation:          mercariapiPb.NewMockInvitationClient(ctrl),
		Items:               mercariapiPb.NewMockItemsClient(ctrl),
		Login:               mercariapiPb.NewMockLoginClient(ctrl),
		Notifications:       mercariapiPb.NewMockNotificationsClient(ctrl),
		PRRedirection:       mercariapiPb.NewMockPRRedirectionClient(ctrl),
		PersonalAttributes:  mercariapiPb.NewMockPersonalAttributesClient(ctrl),
		Points:              mercariapiPb.NewMockPointsClient(ctrl),
		TransactionEvidence: mercariapiPb.NewMockTransactionEvidenceClient(ctrl),
		Users:               mercariapiPb.NewMockUsersClient(ctrl),
	}
}
